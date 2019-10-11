#!/usr/bin/env node

const execSh = require('exec-sh');
const glob = require('glob');
const fs = require('fs');
const fuzzy = require('fuzzy');
const inquirer = require('inquirer');
const path = require('path');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

function deploy(service) {
  const srcPath = path.join(process.cwd(), 'src');
  console.log(`Editing secrets ${service} in ${srcPath}...`);
  const filename = path.join(srcPath, `inventories/group_vars/${service}/secrets`);
  if (fs.existsSync(filename)) {
    execSh(`cd ${srcPath}; ansible-vault --vault-password-file=.vault_password edit ${filename}`);
  } else {
    execSh(`cd ${srcPath}; ansible-vault --vault-password-file=.vault_password create ${filename}`);
  }
}

const questions = [
  {
    type: 'autocomplete',
    name: 'service',
    message: 'Choose a list:',
    source: (anwsers, inp) => {
      const input = inp || '';
      const name = 'config';

      return new Promise((res, rej) => {
        const srcPath = path.join(process.cwd(), 'src/inventories/group_vars');
        glob(path.join(srcPath, `**/${name}`), (err, files) => {
          if (err) return rej(err);
          const services = files.map(item => {
            const dirname = path.dirname(item);
            return dirname.replace(`${srcPath}/`, '');
          });
          const data = fuzzy.filter(input, services.filter(item => item !== ''));
          return res(data.map(item => item.original));
        });
      });
    }
  }
];

inquirer.prompt(questions).then(answers => {
  const { service } = answers;
  deploy(service);
});
