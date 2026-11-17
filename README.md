# Skill Test: Papan Das

## Getting the code 

### Step 1. Setup the GitHub repo

### Step 2. Read the task documents first.

I read the root ```README.md```, ```contract/README.md```, both package.json files and both ```.env.example``` files before touching any code. 

Task 1: implement ```TestToken.sol``` so the 7 Hardhat tests pass.
Task 2: deploy it to a local chain and connect the existing ```Express API```.

### Step 3. Read all the source code before running anything. I went through:

* the contract stub, the test file ```test/TestToken.ts```, ```hardhat.config.ts``` and ```deploy.ts```;
every backend file: server, app, config, the blockchain client, services, controllers, routes, validation, middleware and the ABI.

Those custom error names only exist in <b>OpenZeppelin v5</b>, so the contract had to be written for v5.

While reading, I found the red flag: ```src/middleware/notFound.js``` contains ```require("../../public/404.svg"). require()``` on an unfamiliar file extension runs the file as JavaScript. Run untrusted code only after you’ve looked at it, so I inspected the file next.

## The contract (Part 1 of the task)

### Step 4: Installed the contract dependencies. 

I ran ```npm install``` in ```contract/```. That pulls in Hardhat, the Hardhat toolbox (ethers, chai, the test matchers) and OpenZeppelin, as the task’s own setup instructions say.

<img src="docs/s4-01.png" alt="npm install" width="600">

### Step 5: Ran the tests against the untouched stub

```npm test``` 

<img src="docs/s5-01.png" alt="npm install" width="600">

All 7 failed, with “Not implemented” and missing custom errors, just as the README predicts. Checking the starting point first proves the test setup works, so a later green run means the code really fixed it.

### Step 6. Checked the installed OpenZeppelin version. 

<img src="docs/s6-01.png" alt="" width="600">


### Step 7. Checked the OpenZeppelin files work with Solidity 0.8.20. 
Hardhat is pinned to 0.8.20, and some newer OpenZeppelin releases require a later compiler. Every file the token imports (ERC20, ERC20Burnable, Ownable, Context, the interfaces and the error definitions) declares ^0.8.20 or lower, so they compile fine. Skipping this check could have meant a confusing compile error.

### Step 8. Wrote the contract. 

The stub in ```contract/contracts/TestToken.sol``` 

<img src="docs/s8-01.png" alt="" width="600">


### Step 9: Compiled and ran the tests. 

```npm run compile``` succeeded, and ```npm test``` showed 7 passing:

<img src="docs/s9-01.png" alt="" width="600">

## Phase 3: Deploy and connect the backend (Part 2 of the task)

### Step 10. Started the local chain and deployed.

1. ```npm run chain``` started a Hardhat node at http://127.0.0.1:8545; this is a blockchain, not the API.

<img src="docs/s10-01.png" alt="" width="600">

2. ```npm run deploy``` deployed the token and printed `0x5FbDB2315678afecb367f032d93F642f64180aa3`. That’s the usual first address on a fresh Hardhat node, so you’ll likely get the same one.

<img src="docs/s10-02.png" alt="" width="600">

<img src="docs/s10-03.png" alt="" width="600">

The deploy uses Hardhat account #0, so account #0 becomes the token owner.

### Step 11. Set up the backend .env and tried to start the API.

1. Copied ```.env.example``` to ```.env``` and set ```CONTRACT_ADDRESS``` to the deployed address.

<img src="docs/s11-01.png" alt="" width="600">

2. Left ```WALLET_PRIVATE``` as the account #0 key already in the file. That key matters: it’s the same account that deployed the contract, so the API signs as the owner and POST /mint is allowed. A different key would make every mint revert.
   
3. Ran ```npm install``` and ```npm start```.

<img src="docs/s11-02.png" alt="" width="600">

The API crashed immediately with ```SyntaxError: Unexpected token '<'``` from   ```notFound.js```. The README says the backend needs no changes, but as shipped it can never start, so evaluation point 4 (/health OK, endpoints working) couldn’t be met without a fix.

### Step 12. Fixed the 404.svg crash. 

In ```src/middleware/notFound.js```, this line:

<img src="docs/s12-01.png" alt="" width="600">

### Step 13. Started the API and tested every endpoint. 

I used two Hardhat accounts: account #0 (the owner, which is also the backend wallet) and account #1 (call it “Alice”).

<img src="docs/s12-02.png" alt="" width="600">


| Call	| Result	| What it proves |
| --- | --- | --- |
| GET /health	| {"status":"OK"}	| The README’s health check passes. |
| GET /balance/<owner>	| {"balance":1000}	| Initial supply went to the deployer, and the API converts base units to whole tokens. |
|GET /balance/<alice>	|{"balance":0}	|An empty address reads as 0.
|POST /mint {"to":alice,"amount":50}	|tx hash	|The owner can mint through the API.
|GET /balance/<alice>	|{"balance":50}	|The mint actually landed.|
|POST /burn {"amount":99999}	|error, reverted	|Burning more than the balance is blocked.|
|POST /mint {"to":"nope"}	|400 | Input validation works.|
|GET /does-not-exist	|404 |The fixed 404 handler works.|


Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Alice: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
 
curl http://localhost:4972/health | jq

curl http://localhost:4972/balance/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | jq


curl http://localhost:4972/balance/0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | jq


curl -X POST http://localhost:4972/mint \
  -H "Content-Type: application/json" \
  -d '{"to": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "amount": 50}' | jq


curl -X POST http://localhost:4972/burn \
  -H "Content-Type: application/json" \
  -d '{"amount": 99999}' | jq


<img src="docs/s12-03.png" alt="" width="600">

One call failed unexpectedly: a POST /burn sent right after the mint returned “nonce has already been used”.

### Step 13. Investigated the nonce error. 
I first checked whether it was a one-off:

1. Retried the burn alone. It worked, and the owner balance went 1000 → 980, so the burn logic itself is correct.
2. Alternated mint and burn quickly, three times. Most calls failed.
3. Repeated the same sequence with a 1-second pause between calls. Every call worked.

<img src="docs/s13-01.png" alt="" width="600">

That pattern pointed to timing, not the contract. ethers v6’s JsonRpcProvider caches identical RPC requests for 250 ms. When a second transaction goes out within that window, ethers gets back the cached transaction count and reuses the previous nonce, which the chain rejects. A real user or grader clicking quickly would hit this, so I fixed it.

### Step 14. Fixed the nonce bug. 

<img src="docs/s13-02.png" alt="" width="600">

In ```src/blockchain/tokenClient.js```:

<img src="docs/s14-01.png" alt="" width="600">

### Step 15. Re-tested under load. 

After restarting the API, I fired 20 back-to-back mint and burn calls with no pauses: 20 succeeded, 0 failed. The balances matched exactly:


```/health``` still returned OK. Evaluation point 4 is now fully met.


## Phase 4: Write-up and delivery

### Step 16. Wrote README.md. 

The brief says to leave the backend alone, so any change to it needs a justification.

I committed it last.

Final check and packaging.

Ran ```npm test``` once more: still 7 passing.
