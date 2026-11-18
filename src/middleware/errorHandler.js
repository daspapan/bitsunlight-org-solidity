/* 
const { isProduction } = require("../config/env");
const { AppError } = require("../errors/AppError");
const { logger } = require("../utils/logger");

function contractMessage(error) {
  return (
    error?.shortMessage ||
    error?.reason ||
    error?.info?.error?.message ||
    error?.message ||
    "Contract call failed."
  );
}

const errorHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(error.message);
    }

    return res.status(error.statusCode).json({ message: error.message });
  }

  logger.error("Unhandled error", {
    message: error.message,
    code: error.code,
  });

  const statusCode = error.code === "CALL_EXCEPTION" ? 502 : 500;
  const message = isProduction
    ? "Internal server error."
    : contractMessage(error);

  return res.status(statusCode).json({ message });
};

module.exports = { errorHandler };
*/


const { Interface, formatUnits } = require("ethers");
const { isProduction } = require("../config/env");
const { tokenABI } = require("../constants/tokenABI");
const { AppError } = require("../errors/AppError");
const { logger } = require("../utils/logger");

const tokenInterface = new Interface(tokenABI);
// TestToken uses 18 decimals; only used to format amounts in error messages.
const toTokens = (value) => formatUnits(value, 18);

// Turn a reverted transaction's custom error into a readable 400 response.
// ethers can't decode these on sends, so we parse the revert data ourselves.
function decodeContractError(error) {
  const data = error?.data ?? error?.info?.error?.data;
  if (typeof data !== "string" || data.length < 10) {
    return null;
  }

  let parsed;
  try {
    parsed = tokenInterface.parseError(data);
  } catch {
    return null;
  }
  if (!parsed) {
    return null;
  }

  switch (parsed.name) {
    case "ERC20InsufficientBalance":
      return `Insufficient balance: ${parsed.args.sender} has ${toTokens(
        parsed.args.balance
      )} STT but ${toTokens(parsed.args.needed)} STT was requested.`;
    case "OwnableUnauthorizedAccount":
      return `Only the token owner can mint. ${parsed.args.account} is not the owner.`;
    case "ERC20InvalidReceiver":
      return `Invalid receiver address: ${parsed.args.receiver}.`;
    default:
      return `Contract reverted with ${parsed.name}.`;
  }
}

function contractMessage(error) {
  return (
    error?.shortMessage ||
    error?.reason ||
    error?.info?.error?.message ||
    error?.message ||
    "Contract call failed."
  );
}

const errorHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(error.message);
    }

    return res.status(error.statusCode).json({ message: error.message });
  }

  const contractError = decodeContractError(error);
  if (contractError) {
    logger.warn("Contract call reverted", { message: contractError });
    return res.status(400).json({ message: contractError });
  }

  logger.error("Unhandled error", {
    message: error.message,
    code: error.code,
  });

  const statusCode = error.code === "CALL_EXCEPTION" ? 502 : 500;
  const message = isProduction
    ? "Internal server error."
    : contractMessage(error);

  return res.status(statusCode).json({ message });
};

module.exports = { errorHandler };