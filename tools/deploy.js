#!/usr/bin/env node

const inquirer = require('inquirer');
const execSh = require('exec-sh');
const path = require('path');

const util = require('./util');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

function genVars(chainId) {
  return JSON.stringify({
    chain_id: chainId
  });
}

function deploy(chainId, service) {
  const srcPath = path.join(process.cwd(), 'src');
  console.log(`Deploying to ${service}...`);
  const vars = genVars(chainId);
  execSh(
    `source /tmp/aws_token; cd ${srcPath}; ansible-playbook -i 'inventories/${chainId}-chain.ini' --extra-vars '${vars}' --vault-password-file .vault_password deploy/${service}/main.yml`
  );
}
const questions = [
  {
    type: 'autocomplete',
    name: 'chainId',
    message: 'Please select chain to deploy:',
    source: (anwsers, inp) => {
      const input = inp || '';
      const srcPath = path.join(process.cwd(), 'src/inventories');
      const extractFn = item => {
        const filename = path.basename(item);
        return filename.replace('-chain.ini', '');
      };
      return util.listItems(input, '*-chain.ini', srcPath, extractFn);
    }
  },
  {
    type: 'autocomplete',
    name: 'service',
    message: 'Please select a task to deploy:',
    source: (anwsers, inp) => {
      const input = inp || '';
      const srcPath = path.join(process.cwd(), `src/deploy`);
      const extractFn = item => {
        const dirname = path.dirname(item);
        return dirname.replace(`${srcPath}/`, '');
      };
      return util.listItems(input, 'main.yml', srcPath, extractFn);
    }
  }
];

inquirer.prompt(questions).then(answers => {
  const { chainId, service } = answers;
  deploy(chainId, service);
});
