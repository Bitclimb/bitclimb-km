const { exec } = require('shelljs');
const fs = require('fs');
const path = require('path');
const pidDir = path.resolve(process.env.pm_pid_path, '..');
const pm2_json = process.env.pm2_json;
module.exports = (cmd, name = process.name) => {
  let apps = fs.readdirSync(pidDir).map(p => path.basename(p, '.pid'));
  const pname = name.split(':')[0];
  apps = apps.filter(a => a.match(new RegExp(`${pname}*`)));
  if (apps.length) {
    cmd = `pm2 ${cmd} ${pm2_json} --update-env --only ${apps.join(' ')}`;
    exec(cmd);
  }
};
