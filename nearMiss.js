module.exports = class NearMissMiner extends Miner {
    /**
      * When a new miner is created, but the PoW search is **not** yet started.
      * The initialize method kicks things off.
      * 
      * @constructor
      * @param {Object} obj - The properties of the client.
      * @param {String} [obj.name] - The miner's name, used for debugging messages.
      * * @param {Object} net - The network that the miner will use
      *      to send messages to all other clients.
      * @param {Block} [startingBlock] - The most recently ALREADY ACCEPTED block.
      * @param {Object} [obj.keyPair] - The public private keypair for the client.
      * @param {Number} [miningRounds] - The number of rounds a miner mines before checking
      *      for messages.  (In single-threaded mode with FakeNet, this parameter can
      *      simulate miners with more or less mining power.)
      */
     constructor({name, net, startingBlock, keyPair, miningRounds=Blockchain.NUM_ROUNDS_MINING} = {}) {
       super({name, net, startingBlock, keyPair});
       this.miningRounds=miningRounds;
   
       // Set of transactions to be added to the next block.
       this.transactions = new Set();
       let nearMiss = 0;
     }
   
     
     findProof(oneAndDone=false) {
       let pausePoint = this.currentBlock.proof + this.miningRounds;
       while (this.currentBlock.proof < pausePoint) {
         if (this.currentBlock.hasValidProof()) {
           this.log(`found proof for block ${this.currentBlock.chainLength}: ${this.currentBlock.proof}`);
           this.announceProof();
           // Note: calling receiveBlock triggers a new search.
           this.receiveBlock(this.currentBlock);
           break;
         }
        else if(this.currentBlock.isNearMiss()) { 
          this.log(`found near-miss for block ${this.currentBlock.chainLength}: ${this.currentBlock.nearMiss}`); //need to find near miss
          this.announceNearMiss();
          this.receiveBlock(this.currentBlock);
         }
         this.currentBlock.proof++;
       }
       // If we are testing, don't continue the search.
       if (!oneAndDone) {
         // Check if anyone has found a block, and then return to mining.
         setTimeout(() => this.emit(Blockchain.START_MINING), 0);
       }
     }
   
   
     announceNearMiss() {
       // post transaction for near miss
       // record near miss in data field
       this.net.broadcast(Blockchain.PROOF_FOUND, this.currentBlock);
     }
   
   };