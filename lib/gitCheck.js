const vizion = require('vizion');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const pm2json = process.env.pm2_json;
const pidDir = path.resolve(process.env.pm_pid_path, '..');
const gitupdate = reply => {
  vizion.update({ folder: process.cwd() }, (err, newmeta) => {
    if (err) throw new Error(err);
    else {
      reply({ update: newmeta, action: 'restarting...' });
      let apps = fs.readdirSync(pidDir).map(p => path.basename(p, '.pid'));
      const pname = process.name.split(':')[0];
      apps = apps.filter(a => a.match(new RegExp(`${pname}*`)));
      exec(`pm2 restart ${pm2json} --update-env --only ${apps.join(' ')}`);
    }
  });
};
const isUpdated = (pmx, cb) => {
  vizion.isUpToDate({ folder: process.cwd() }, (err, meta) => {
    if (err) throw new Error(err);
    if (!meta.is_up_to_date) {
      cb(false);
      pmx.action(`GitPull: #${meta.new_revision.slice(0, 5)}`, gitupdate);
    } else {
      cb(true);
    }
  });
};

module.exports = (pmx, ms) => {
  if (!pm2json || !pidDir) {
    return;
  }
  const runner = () => {
    isUpdated(pmx, r => {
      if (r) {
        setTimeout(runner, ms);
      }
    });
  };
  process.nextTick(runner);
};
