[![Build Status](https://travis-ci.com/vigcoin/webapi.svg?branch=master)](https://travis-ci.com/vigcoin/webapi.svg?branch=master)
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
```

# Run Web API server

platform: ubuntu 18.04/16.04

1. `git clone --depth 1 https://github.com/vigcoin/webapi.git`

2. `cd webapi && npm install`

3. `npm install -g ts-node`

4. `ts-node src/index.ts`

> default port is 8080, use `PORT=8081 ts-node src/index.ts` to change port number

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
