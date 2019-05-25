[![Build Status](https://travis-ci.com/vigcoin/webapi.svg?branch=master)](https://travis-ci.com/vigcoin/webapi)
[![Coverage Status](https://coveralls.io/repos/github/vigcoin/webapi/badge.svg?branch=master)](https://coveralls.io/github/vigcoin/webapi?branch=master)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

# Web Api for vigcoin

# Setup

Webapi is tested on ubuntu 16.04. Other Linux platform can easily adapte to use vigcoin webapi.

Before running webapi, here are some bash steps you should follow:

```
sudo apt-get install gcc
curl https://sh.rustup.rs -sSf | sh -s -- -y
source "$HOME/.cargo/env"
curl -o- https://raw.githubusercontent.com/calidion/chinese-noder-the-easy-way/master/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

# config npm (For Chinese)

If you are in China and find it very slow to install npm packages. The following instruction will be helpful.

Create a file

```
touch ~/.npmrc
```

with the following content.

```
registry=https://registry.npm.taobao.org/
```

You can add the following optional content when necessary:

```
disturl=https://npm.taobao.org/dist
chromedriver_cdnurl=http://cdn.npm.taobao.org/dist/chromedriver
operadriver_cdnurl=http://cdn.npm.taobao.org/dist/operadriver
phantomjs_cdnurl=http://cdn.npm.taobao.org/dist/phantomjs
fse_binary_host_mirror=https://npm.taobao.org/mirrors/fsevents
sass_binary_site=http://cdn.npm.taobao.org/dist/node-sass
electron_mirror=http://cdn.npm.taobao.org/dist/electron/
```

# Run Web API server


platform: ubuntu 18.04/16.04

## Run with ts-node

1. `git clone --depth 1 https://github.com/vigcoin/webapi.git`

2. `cd webapi && npm install`

3. `npm install -g ts-node`

4. `ts-node src/main.ts`

> default port is 8080, use `PORT=8081 ts-node src/main.ts` to change port number

## Run with pm2


1. `git clone --depth 1 https://github.com/vigcoin/webapi.git`

2. `cd webapi && npm install`

3. `npm install -g pm2 && pm2 install typescript`

4. `pm2 start src/main.ts`



# Web APIs

## Wallet API


### Create Wallet

1. url

`/wallet/create`

2. Parameters

None

3. Response JSON

address: Address for the wallet
spend: Private key for spending.
view: Private key for viewing.

```
{
  "code": 0,
  "data": {
    "address": "BFrj6s15vg47Za5ipA46m8CjV59nsEeeNSSozZzs9WEo759Prf3zXke4caP22RESH5Yj2GJubQ6WPCDBR78MX3myNaHsWME",
    "spend": "32e4e5f72797c2fc0e2dda4e80e61bd0093934a305af08c9d3b942715844aa08",
    "view": "95a27c683df6a73bfc238d78fc55f414c699735d60fad4e3a999806763cb340d"
  },
  "message": "成功！",
  "name": "Success"
}
```


### Open Wallet

1. url

`/wallet/open`

2. Parameters

| Parameter Name | Type | Optional |
| --- | --- | --- |
| file | File | N |
| password | String | Y |

3. Response JSON

address: Address for the wallet
spend: Private key for spending.
view: Private key for viewing.

```
{
  "code": 0,
  "data": {
    "address": "BFrj6s15vg47Za5ipA46m8CjV59nsEeeNSSozZzs9WEo759Prf3zXke4caP22RESH5Yj2GJubQ6WPCDBR78MX3myNaHsWME",
    "keys": {
      "spend": "32e4e5f72797c2fc0e2dda4e80e61bd0093934a305af08c9d3b942715844aa08",
      "view": "95a27c683df6a73bfc238d78fc55f414c699735d60fad4e3a999806763cb340d"
    }
  },
  "message": "成功！",
  "name": "Success"
}
```

### Refine Wallet

Old vigcoin saves cache in wallet file. New vigcoin wallet will use no cache in wallet file.

cache files will be separated from wallet.

1. url

`/wallet/refine`

2. Parameters

| Parameter Name | Type | Optional |
| --- | --- | --- |
| file | File | N |
| password | String | Y |

3. Response File

will retrun an file which is in a vigcoin wallet format

or 

return status 500 if wrong.

### Generate Wallet from Keys

1. url

`/wallet/export`

2. Parameters

| Parameter Name | Type | Optional |
| --- | --- | --- |
| spend | String | N |
| view | String | N |

spend/view are spend and view private keys.

3. Response File

will retrun an file which is in a vigcoin wallet format

or 

return status 500 if wrong.
