[![Build Status](https://travis-ci.com/vigcoin/webapi.svg?branch=master)](https://travis-ci.com/vigcoin/webapi.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/vigcoin/webapi/badge.svg?branch=master)](https://coveralls.io/github/vigcoin/webapi?branch=master)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

# Web Api for vigcoin


## Wallet API


### 创建钱包

1. url

`/wallet/create`

2. 参数

无

3. 返回参数

address: 钱包地址.
spend: 花费时使用的密钥
view: 查看时使用的密钥

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


### 打开钱包

1. url

`/wallet/open`

2. 参数

| 参数名 | 类型 | 是否可选 |
| --- | --- | --- |
| file | File | N |
| password | String | Y |

3. 返回参数

address: 钱包地址.
spend: 花费时使用的密钥
view: 查看时使用的密钥

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
