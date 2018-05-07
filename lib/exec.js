const debug = require('debug')('bitclimb-km:exec');
const { execSync } = require('child_process');
const pm2_json = process.env.pm2_json;
const proclist = JSON.parse(process.env.pm2_list);

module.exports = (cmd, name = process.title) => {
  const pname = name.split(':')[0];
  const apps = proclist.filter(a => a.match(new RegExp(`${pname}*`)));
  if (apps.length) {
    const env = process.env.NODE_ENV == 'development' ? '--env development' : '';
    cmd = `pm2 ${cmd} ${pm2_json} --update-env --only ${apps.join(' ')} ${env}`;
    debug(`Executing ${cmd}`);
    try {
      execSync(cmd);
    } catch (e) {
      debug('Got an error', e.message);
    }
  }
};
