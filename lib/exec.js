const { exec } = require('shelljs');
const pm2_json = process.env.pm2_json;
const proclist = process.env.pm2_list;

module.exports = (cmd, name = process.title) => {
  const pname = name.split(':')[0];
  const apps = proclist.filter(a => a.match(new RegExp(`${pname}*`)));
  if (apps.length) {
    const env = process.env.NODE_ENV == 'development' ? '--env development' : '';
    cmd = `pm2 ${cmd} ${pm2_json} --update-env --only ${apps.join(' ')} ${env}`;
    exec(cmd);
  }
};
