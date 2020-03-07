import {
  calls, runtime, chain, system, runtimeUp, pretty,
  addressBook, secretStore, metadata, nodeService, bytesToHex, hexToBytes, AccountId
} from 'oo7-substrate';
import {sign, verify} from '@polkadot/wasm-schnorrkel';
import bech32 from 'bech32';
import * as crypto from 'crypto-js';
import axios from 'axios';

const api = {
  hrp: "tyee",
  salt: "yee",
  keySize: 256,
  iterations: 100,
  switchRootUrl: '',

  request(method, path, params) {
    let url = api.switchRootUrl + path
    params = params || {}

    if (method === 'get') {
      return new Promise((resolve, reject) => {
        axios.get(url, {
          params: params
        }).then(
          res => {
            if (res.data.error
            ) {
              reject(res)
            } else {
              resolve(res)
            }
          },
          res => {
            reject(res)
          }
        )
      })
    } else if (method === 'post') {
      return new Promise((resolve, reject) => {
        let data = null
        if (params.body) {
          data = params.body
        } else {
          // data = $.param(params)
          data = params
        }
        axios.post(url, data).then(
          res => {
            if (res.data.error) {
              reject(res)
            } else {
              resolve(res)
            }
          },
          res => {
            reject(res)
          }
        )
      })
    }
  },
  rpcCall(method, params) {
    return api.request('post', '', {'jsonrpc': '2.0', 'id': api.id++, 'method': method, 'params': params})
  },

  utils: {

    isIntNum(val) {
      var regPos = /^\d+$/; // 非负整数
      if (regPos.test(val)) {
        return true;
      } else {
        return false;
      }
    },

    bech32Encode(bytes) {
      return bech32.encode(api.hrp, bech32.toWords(bytes))
    },
    bech32Decode(str) {
      return new Uint8Array(bech32.fromWords(bech32.decode(str).words))
    },

    // plainTextHex: hex without leading '0x'
    // password: utf8 string
    // return: hex
    encrypt(plainTextHex, password) {

      const key = api.utils.getKey(password);
      const keyHex = key[0];
      const ivHex = key[1];

      const encrypted = crypto.AES.encrypt(crypto.enc.Hex.parse(plainTextHex), crypto.enc.Hex.parse(keyHex), {
        iv: crypto.enc.Hex.parse(ivHex),
        padding: crypto.pad.NoPadding,
        mode: crypto.mode.CTR
      });

      return encrypted.ciphertext.toString();
    },

    // cypherTextHex: hex without leading '0x'
    // password: utf8 string
    // return: hex
    decrypt(cypherTextHex, password) {
      const key = api.utils.getKey(password);
      const keyHex = key[0];
      const ivHex = key[1];

      const cypherText = crypto.enc.Hex.parse(cypherTextHex);
      const cypherTextBase64 = crypto.enc.Base64.stringify(cypherText);

      let decrypted = crypto.AES.decrypt(cypherTextBase64, crypto.enc.Hex.parse(keyHex), {
        iv: crypto.enc.Hex.parse(ivHex),
        padding: crypto.pad.NoPadding,
        mode: crypto.mode.CTR
      });

      return decrypted.toString(crypto.enc.Hex);

    },

    // password: utf8 string
    // return [keyHex, ivHex]
    getKey(password) {

      const salt = api.salt;
      const keySize = api.keySize;
      const iterations = api.iterations;
      const rawKeyHex = crypto.PBKDF2(crypto.enc.Utf8.parse(password), salt, {
        keySize: keySize / 32 * 2,
        iterations: iterations
      }).toString();
      // console.log("raw key:" + rawKeyHex);

      const rawKey = hexToBytes(rawKeyHex);

      const keyHex = bytesToHex(rawKey.slice(0, 32));
      const ivHex = bytesToHex(rawKey.slice(32, 64));

      // console.log("key:" + keyHex);
      // console.log("iv:" + ivHex);

      return [keyHex, ivHex];

    },

    getShardNum(addressPublic) {
      //TODO this is verfy temporary implementation
      let last = addressPublic[31]
      let mask = 0x03
      let shardNum = mask & last
      return shardNum
    },
    runInBalancesTransferCall(dest, value, calls, cb) {
      //0400ff a0837b84eedaf81b26323f05426b39eeedbb4d28868727de045eb679ac2c9b59 a10f
      // calls.balances.transfer tie doesnot work, so build manually
      const callHex = "0400FF" + bytesToHex(dest) + bytesToHex(encode(value, 'Compact<u128>'))
      const call = hexToBytes(callHex)
      console.log('runInBalancesTransferCall: ', call)
      cb(call)

    },
    runInIssueAssetCall(name, supply, decimals, calls, cb) {
      const callHex = "0800" + bytesToHex(encode(name, 'Vec<u8>')) + bytesToHex(encode(supply, 'Compact<u128>')) +
        bytesToHex(encode(decimals, 'Compact<u128>'))
      const call = hexToBytes(callHex)
      console.log('runInIssueAssetCall: ', call)
      cb(call)
    },
    runInAssetTransferCall(shard_code, id, dest, value, calls, cb) {
      const callHex = "0801" + bytesToHex(encode(hexToBytes(shard_code), 'Vec<u8>'))+ bytesToHex(encode(id, 'Compact<u64>'))+ 'ff' + bytesToHex(dest) + bytesToHex(encode(value, 'Compact<u128>'))
      console.log('runInIssueAssetcallHex: ', callHex)
      const call = hexToBytes(callHex)
      console.log('runInIssueAssetCall: ', call)
      cb(call)
    },
    runInStorageTransferCall(data, calls, cb) {
      const callHex = "0a00" + bytesToHex(encode(data, 'Vec<u8>'))
      const call = hexToBytes(callHex)
      console.log('runInStorageTransferCall: ', call)
      cb(call)
    },
    composeTransaction(senderPublic, secret, call) {

      return new Promise((resolve, reject) => {

        let shardNum = api.utils.getShardNum(senderPublic)
        console.log('shardNum:', shardNum)

        api.rpcCall('chain_getHeader', [shardNum, null]).then((res) => {

          let height = eval(res.data.result.number)
          console.log('height: ', height)

          //
          let longevity = 64
          let l = Math.min(15, Math.max(1, Math.ceil(Math.log2(longevity)) - 1))
          let period = 2 << l
          let factor = Math.max(1, period >> 12)
          let Q = (n, d) => Math.floor(n / d) * d
          let eraNumber = Q(height, factor)
          let phase = eraNumber % period
          let era = new TransactionEra(period, phase)
          //

          api.rpcCall('chain_getHead', [shardNum, eraNumber]).then((res) => {
            let eraHash = hexToBytes(res.data.result)

            console.log('eraHash: ', res.data.result, eraHash)

            api.rpcCall('state_getNonce', [api.utils.bech32Encode(senderPublic)]).then((res) => {
              let index = eval(res.data.result)
              console.log('index: ', index)

              let e = encode([
                index, call, era, eraHash
              ], [
                'Compact<Index>', 'Call', 'TransactionEra', 'Hash'
              ])

              console.log('e: ', e)

              let signature = sign(senderPublic, secret, e)
              if (!verify(signature, e, senderPublic)) {
                console.warn(`Signature is INVALID!`)
                reject('sign error')
                return
              }
              console.log('signature: ', signature)

              let senderAccountId = new AccountId(senderPublic)
              console.log('senderAccountId: ', senderAccountId)

              let signedData = encode(encode({
                _type: 'Transaction',
                version: 0x81,
                sender: senderPublic,
                signature,
                index,
                era,
                call
              }), 'Vec<u8>')
              let extrinsic = '0x' + bytesToHex(signedData)
              console.log("extrinsic:", extrinsic)

              api.rpcCall('author_submitExtrinsic', [extrinsic]).then(
                (res) => {
                  console.log("res:", res)
                  resolve(res)
                }
              ).catch((res) => {
                console.log("err:", res)
                reject(res)
              })

            }).catch((res) => {
              reject(res)
            })

          }).catch((res) => {
            reject(res)
          })


        }).catch((res) => {
          reject(res)
        })

      })

    },
  }
}

export default api
