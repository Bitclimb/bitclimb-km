const debug = require('debug')('bitclimb-km:gitCheck');
const vizion = require('vizion');
const exec = require('./exec');
const pm2json = process.env.pm2_json;

const gitupdate = reply => {
  debug('gitupdate called');
  vizion.update({ folder: process.cwd() }, (err, newmeta) => {
    if (err) {
      debug('Got error', err.message);
      throw new Error(err);
    } else {
      reply({ update: newmeta, action: 'restarting...' });
      exec('restart');
    }
  });
};
const isUpdated = (pmx, cb) => {
  debug('isUpdated called');

  vizion.isUpToDate({ folder: process.env.pm_cwd }, (err, meta) => {
    if (err) {
      debug('Got error', err.message);
      throw new Error(err);
    }
    if (!meta.is_up_to_date) {
      debug('isUpdated is false');
      cb(`new commit found ${meta.new_revision}`);
      pmx.action('GitUpdate', gitupdate);
    } else {
      debug('isUpdated is true');
      cb('updated');
    }
  });
};

exports.start = (pmx) => {
  if (!pm2json) {
    return;
  }
  pmx.action('GitCheck', reply => {
    isUpdated(pmx, reply);
  });
};
exports.stop = () => {
  return true;
};
