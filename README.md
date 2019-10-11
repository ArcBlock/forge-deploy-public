# Forge Deploy

Forge deployment script for build a multi-node / multi-validator chain. Tested on MacOS only. Should work for ubuntu / centos (you need to install tools like ansible, yarn, etc. manually), not sure for windows.

## Makefile targets

There are several targets:

* make deploy: carry out the deployment tasks
* make vault: create or edit the secret configuration (please use `make gen-password` to generate vault password firstly)
* make gen-password: generate src/.vault_password with pwgen (you could just create this file and put whatever password you want)

Mostly you don't need to run `make vault` and `make gen-password` if you don't have secret configuration.

## Usage

### Initialization

Make sure you have the nodejs > 10.x and yarn installed, then run `make init` to install tools (only works for MacOS). For unbuntu/CentOS, you shall install `ansible` manually and then `cd tools; yarn install`.

### Creating the inventory file

This repo allows you to deploy multiple chains. Each chain is represented by an inventory file. You shall create a file in `src/inventories/<your-chain-id>-chain.init`. For example, `src/inventories/example-chain.ini`:

```
[region1]
34.220.179.5 public_ip=34.220.179.5 pretty_hostname=test-chain-1  ansible_user=ec2-user chain_id=test-chain  node_type=validator ansible_ssh_private_key_file=~/.ssh/forge
```

This is a typical ansible inventory file which you can have multiple hosts in it. Each host must have these attributes:

* public_ip: we use this information to generate forge configuration (for p2p connectivity)
* pretty_hostname: we use this as the moniker of the node
* ansible_user / ansible_ssh_private_key_file: we use this for ssh to the server
* chain_id: we use this for identifying the chain
* node_type: validator | sentinel. If the node is validator, the node will be participating in the block generation. Otherwise the node will just do broadcast / synchronization.

Once you have the inventory file ready (the name convention '*-chain.ini' is important!), you can run `make deploy`, and your chain inventory will be autodetected, like this:

```bash
$ make deploy
? Please select chain to deploy: (Use arrow keys or type to search)
❯ example
  my-awesome-app
```

Choose the right chain you want to deploy, you will get to choose the deploy target:

```bash
$ make deploy
? Please select chain to deploy: example
? Please select a task to deploy: (Use arrow keys or type to search)
❯ init_forge_network
  upgrade_forge_cli
```

Currently there're two targets:

* init_forge_network: initialize the forge network.
* upgrade_forge_cli: install / upgrade to the forge cli version you want.

If it is the first run on the target hosts, you shall run `upgrade_forge_cli` first. After choosing it, and providing the forge cli version for upgrade, you will get this:

```bash
$ make deploy
? Please select chain to deploy: example
? Please select a task to deploy: upgrade_forge_cli
Deploying to upgrade_forge_cli...
What's version to upgrade? [latest]:

PLAY [all] *****************************************************************************************************************************
...
```

Once it is finished, the latest forge-cli version is installed to these inventories.

Then you can run the `init_forge_network` task:

```bash
$ make deploy
? Please select chain to deploy: example
? Please select a task to deploy: init_forge_network
Deploying to init_forge_network...
What's the forge version? [0.38.7]:
Do you have a separate data disk? [False]:

PLAY [all] *****************************************************************************************************************************
```

We advise you to use a separate data disk for forge data, so that you can backup/restore it easily. If you have a data disk, say it is `/dev/xvdf` (if not, you shall manually edit `forge_data_disk` in `src/inventories/group_vars/all/config`), you can set use data disk to true in this step:

```
Do you have a separate data disk? [False] True
```

If you don't have a data disk, don't worry, the default option works well.

Normally after a while the script will finish and your chain will be up. Then you can open a browser to visit any of the node via `https://<public-ip>:8210`.

## How the init_forge_network works

init_forge_network has several steps:

* first of all, mount the data disk (if use data disk)
* then stop any forge instances that potentially running (just for god's sake)
* then generate node key and validator key
* then generate forge configuration
* then backup node key, validator key and forge configuration (if backup_keys is true, by default it is false, you need to look into forge/backup_key role to fine-tune it before enabling it)
* prepare forge running environment
* start forge and forge web

Major code is at `src/roles/forge`.

The main configuration is at `src/inventories/group_vars/all/config`. Feel free to tune it.
