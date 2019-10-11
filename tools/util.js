const glob = require('glob');
const fuzzy = require('fuzzy');
const inquirer = require('inquirer');
const path = require('path');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));


function listItems(input, name, srcPath, extractFn) {
  return new Promise((res, rej) => {
    glob(path.join(srcPath, `**/${name}`), (err, files) => {
      if (err) return rej(err);
      const items = files.map(extractFn);
      const data = fuzzy.filter(input, items.filter(item => item !== ''));
      return res(data.map(item => item.original));
    });
  });
}


exports.listItems = listItems;
