const Web3 = require('web3')
const fs = require('fs')
const readline = require("readline")

const rpcURL = '' //нода эфира
const web3 = new Web3(rpcURL)

let accounts = []

const maniFoldContractAddress = '0x44e94034AFcE2Dd3CD5Eb62528f239686Fc8f162'
const maniFoldABI = [{"inputs":[{"internalType":"address","name":"creatorContractAddress","type":"address"},{"internalType":"uint256","name":"claimIndex","type":"uint256"},{"internalType":"uint32","name":"mintIndex","type":"uint32"},{"internalType":"bytes32[]","name":"merkleProof","type":"bytes32[]"},{"internalType":"address","name":"mintFor","type":"address"}],"name":"mint","outputs":[],"stateMutability":"payable","type":"function"}]
const maniFoldContract = new web3.eth.Contract(maniFoldABI, maniFoldContractAddress)

const creatorAddress = '0x277f448A4d43318EA626Fd224b3bF77295387D68' // контракт картинки
const value = '0.01' // value в eth
const gwei = '15' // газ в gwei
const gasLimit = '200000' // по наблюдениям 200к всегда хватает
const claimIndex = '1407353072' // индекс искать в f12 -> network -> campaignid


async function getInfo(){
    const acc = readline.createInterface({ 
      input:fs.createReadStream('accs.txt'), //Название файла с ключами
    })
    for await (let line of acc) {
      accounts.push({privateKey: web3.eth.accounts.privateKeyToAccount(line).privateKey, address: web3.eth.accounts.privateKeyToAccount(line).address})
    }
}

async function singleCall(signedTx){
    web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    .catch(e =>{
      console.log(`Transaction ${e.message.transactionHash} fail!`)
    })
    return signedTx.transactionHash
}

async function signTransaction(tx, privateKey){
    return await web3.eth.accounts.signTransaction(tx, privateKey)
}

async function buildTransaction(account){
    const data = maniFoldContract.methods.mint(creatorAddress, claimIndex, 0, [], account.address).encodeABI()

    const tx = {
        to: maniFoldContractAddress,
        value: web3.utils.toWei(value, "ether"),
        gas: gasLimit,
        maxFeePerGas: web3.utils.toWei(gwei, 'gwei'),
        maxPriorityFeePerGas: web3.utils.toWei(gwei, 'gwei'),
        data: data
    }

    return await signTransaction(tx, account.privateKey)
}


async function main(){
    web3.eth.net.isListening()
    .then(console.log)

    await getInfo()
    console.log('Accounts:\n')
    let totalBalance = 0

    console.log('\n')
    
    for(let account of accounts){
        balance = Number(web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether'))
        totalBalance += balance
        console.log(`${account.address} ${balance}`)
    }

    console.log(`\nTotal balance: ${totalBalance} ETH`)

    let signedTxs = []

    for(let account of accounts){
        signedTxs.push(await buildTransaction(account))
    }

    for(let signedTx of signedTxs){
        console.log(await singleCall(signedTx))
    }

}

main()