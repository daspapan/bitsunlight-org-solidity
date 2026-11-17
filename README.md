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
<img src="docs/s7-01.png" alt="npm install" width="600">



