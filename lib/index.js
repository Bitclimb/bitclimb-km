const pmx = require('pmx');
const EventEmitter = require('eventemitter3');
const gitCheck = require('./gitCheck');
const pmexec = require('./exec');
const isActive = process.env.PMX == 'true';
const kmtimeout = process.env.KM_TIMEOUT ? parseInt(process.env.KM_TIMEOUT) : 60000;
let instance = null;

class PMX extends EventEmitter {
  constructor() {
    super();
    const self = this;
    self._init();
    self.metrics = {};
    self._pmxMetrics();
  }
  static get instance() {
    if (instance instanceof PMX) {
      return instance;
    }
    instance = new PMX();
    return instance;
  }
  _init() {
    if (!isActive) {
      return false;
    }
    const self = this;
    self.pmx = pmx.init({
      network: true,
      ports: true,
      http: true,
      errors: true,
      custom_probes: true,
    });
    self.probe = self.pmx.probe();
    gitCheck.start(self.pmx, kmtimeout);
  }
  stop() {
    gitCheck.stop();
  }
  exec(cmd) {
    pmexec(cmd);
  }
  // type[metric,counter,meter,histogram]
  _addMetrics(key, type, opts) {
    if (!isActive) {
      return false;
    }
    const self = this;
    if (!self.metrics[key]) {
      // required opts {name}
      self.metrics[key] = self.probe[type](opts);
    }
  }
  removeMetrics(key) {
    if (!isActive) {
      return false;
    }
    const self = this;
    delete self.metrics[key];
  }
  _actionHandler(reply, err, data) {
    if (!err) {
      const payload = { success: true };
      Object.assign(payload, data);
      reply(payload);
    } else {
      reply({ success: false, error: err.message || err });
    }
  }
  addActions(label, action, hasArgs = false) {
    if (!isActive) {
      return false;
    }
    const self = this;
    const event = `${label}:${action}`;
    if (!hasArgs) {
      self.pmx.action(event, reply => {
        self.emit(label, action, (err, data = {}) => {
          self._actionHandler(reply, err, data);
        });
      });
    } else {
      self.pmx.action(event, (args, reply) => {
        self.emit(label, action, args, (err, data = {}) => {
          self._actionHandler(reply, err, data);
        });
      });
    }
  }
  _pmxMetrics() {
    const self = this;
    // metric format is {key,type,opts,method,value[optional]}
    self.on('metric', data => {
      if (!isActive) {
        return false;
      }
      if (!Array.isArray(data)) {
        data = [data];
      }
      for (const metric of data) {
        if (!self.metrics[metric.key]) {
          self._addMetrics(metric.key, metric.type, metric.opts);
        }
        switch (metric.method) {
          case 'set':
            self.metrics[metric.key].set(metric.value);
            break;
          case 'inc':
            self.metrics[metric.key].inc();
            break;
          case 'dec':
            self.metrics[metric.key].dec();
            break;
          case 'mark':
            self.metrics[metric.key].mark();
            break;
          case 'update':
            self.metrics[metric.key].update(metric.value);
            break;
          default:
            break;
        }
      }
    });
  }
}

module.exports = PMX.instance;
