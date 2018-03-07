#!/usr/bin/env node
const program = require('commander');
const version = require('./package').version;
const read = require('read');

program.Password = program.password;
program.password = null;

let main = async (program) => {
    await require('./resume')({
        user: program.username,
        password: program.password
    });
};

program
  .version(version)
  .option('-u, --username [value]', '智联招聘用户名')
  .option('-p, --password [value]', '智联招聘密码')
    .parse(process.argv);

if (program.username) {
    if (!program.password) {
        read({ prompt: 'Password: ', silent: true }, function (er, password) {
            program.password = password;
            main(program);
        });
    } else {
        main(program);
    }
} else {
    program.outputHelp();
}