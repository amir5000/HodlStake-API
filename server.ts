import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { mintPyFromToken } from "./pendle/mintPyFromToken";
import { getSigner, getTokenABI, getTransfers } from "./helpers";
import { Contract, parseUnits, verifyMessage } from "ethers";
import { getCustomerMetaFields } from "./shopify/getCustomerMetaFields";
import { setCustomerMetaField } from "./shopify/setCustomerMetaField";
import { deleteCustomerMetaFieldById } from "./shopify/deleteCustomerMetaFieldById";
import helmet from "helmet";
import { swapTokenForPT } from "./pendle/swapTokenForPT";
import rateLimit from "express-rate-limit";
import { marketData } from "./pendle/marketData";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const allowedOrigin = "http://localhost:3000";

// app.use(
//     cors({
//         origin: (origin, callback) => {
//             console.log("origin: ", origin);
//             if (!origin || allowedOrigin.includes(origin)) {
//                 callback(null, true);
//             } else {
//                 callback(new Error("Not allowed by CORS"));
//             }
//         },
//     })
// );

// app.use((req, res, next): any => {
//     const origin = req.get("origin");
//     console.log("origin: ", origin);
//     if (!origin || origin !== allowedOrigin) {
//         return res.status(403).send("Access denied");
//     }
//     next();
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 60, // Limit each IP to 60 requests per windowMs
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

app.get("/", (req, res) => {
    res.json({ message: "HodlStake" });
});

app.get("/api", (req, res) => {
    res.json({ message: "HodlStake API" });
});

app.get("/api/tangocard/auth", async (req, res): Promise<void> => {
    const options = {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            scope: "raas.all",
            audience: "https://api.tangocard.com/",
            grant_type: "client_credentials",
            client_id: process.env.TANGO_CLIENT_ID || "",
            client_secret: process.env.TANGO_CLIENT_SECRET || "",
        }),
    };

    try {
        const response = await fetch("https://sandbox-auth.tangocard.com/oauth/token", options);

        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).json({ error: errorText });
            return;
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error fetching token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/catalogs", async (req, res): Promise<void> => {
    if (!req.headers.authorization) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            authorization: req.headers.authorization,
        },
    };

    try {
        const response = await fetch(`${process.env.TANGO_API_URL}/catalogs?verbose=true`, options);

        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).json({ error: errorText });
            return;
        }

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error("Error fetching token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/accounts", async (req, res): Promise<void> => {
    if (!req.headers.authorization) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            authorization: req.headers.authorization,
        },
    };

    try {
        const response = await fetch(`${process.env.TANGO_API_URL}/accounts`, options);

        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).json({ error: errorText });
            return;
        }

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error("Error fetching token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/customers", async (req, res): Promise<void> => {
    if (!req.headers.authorization) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            authorization: req.headers.authorization,
        },
    };

    try {
        const response = await fetch(`${process.env.TANGO_API_URL}/customers`, options);

        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).json({ error: errorText });
            return;
        }

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error("Error fetching token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/customer/:customerId/metafields", async (req, res): Promise<void> => {
    const { customerId } = req.params;

    const customerMetaFields = await getCustomerMetaFields({ customerId });
    if (!customerMetaFields) {
        res.status(500).json({ error: "Failed to fetch customer meta fields" });
        return;
    }

    res.json(customerMetaFields);
});

app.post("/api/customer/:customerId/metafields", async (req, res): Promise<void> => {
    const { customerId } = req.params;

    const reqBody: {
        key: string;
        value: string;
        type: string;
        namespace: string;
    } = req.body;

    const body = {
        metafield: reqBody,
    };

    const customerMetaFields = await setCustomerMetaField({ customerId, body });
    if (!customerMetaFields) {
        res.status(500).json({ error: "Failed to save customer meta fields" });
        return;
    }

    res.json(customerMetaFields);
});

app.delete("/api/customer/:customerId/metafields/:metafieldId", async (req, res): Promise<void> => {
    const { customerId, metafieldId } = req.params;

    const customerMetaFields = await deleteCustomerMetaFieldById({ customerId, metafieldId });
    if (!customerMetaFields) {
        res.status(500).json({ error: "Failed to delete customer meta fields" });
        return;
    }

    res.json(customerMetaFields);
});

app.get("/api/markets/:chainId", async (req, res): Promise<void> => {
    const { chainId } = req.params;

    const url = `${process.env.HOSTED_SDK_URL}v1/${chainId}/markets/active`;

    try {
        const response = await fetch(url, {
            method: "GET",
        });

        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).json({ error: errorText });
            return;
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error fetching markets:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/api/markets/:chainId/:marketAddress/swap", async (req, res): Promise<void> => {
    const { chainId, marketAddress } = req.params;
    const { tokenIn, tokenOut, amountIn, receiver } = req.body;

    if (!tokenIn || !tokenOut) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }

    // const signer = getSigner();
    // const tokenOutContract = new Contract(tokenOut, getTokenABI(), signer);
    // console.log("tokenOutDecimals: ", tokenOutDecimals);

    const response = await swapTokenForPT({
        chainId,
        receiver,
        marketAddress,
        tokenIn,
        tokenOut,
        amountIn,
    });

    res.json(response);
});

app.get("/api/markets/:chainId/:marketAddress/data", async (req, res): Promise<void> => {
    const { chainId, marketAddress } = req.params;

    const response = await marketData({
        chainId,
        marketAddress,
    });

    res.json(response);
});

app.get("/api/transfer/:txHash", async (req, res): Promise<void> => {
    const { txHash } = req.params;
    const transfers = await getTransfers(txHash);
    res.json(transfers);
});

app.post("/api/mint/:chainId", async (req, res): Promise<void> => {
    const { chainId } = req.params;

    const {
        receiver,
        amountIn,
        tokenIn,
        yt,
        txHash,
        decimals,
    }: {
        receiver: string;
        amountIn: string;
        tokenIn: string;
        yt: string;
        txHash: string;
        txStatus: string;
        decimals: string;
    } = req.body;

    if (!receiver || !amountIn || !tokenIn || !yt) {
        res.status(400).json({
            error: `missing ${!receiver ? "receiver " : ""}${!amountIn ? "amountIn " : ""}${!tokenIn ? "tokenIn " : ""}
${!yt ? "yt " : ""}${!txHash ? "txHash " : ""}
            `,
        });
        return;
    }

    // const signer = getSigner();
    // const mainAddress = await signer.getAddress();
    // const token = tokenInAddress === "0x0000000000000000000000000000000000000000" ? null : new Contract(tokenInAddress, getTokenABI(), signer);
    // const ytToken = new Contract(ytAddress, getTokenABI(), signer);
    // const decimals = token ? await token.decimals() : 18;
    // const ytTokenDecimals = await ytToken.decimals();
    const response = await mintPyFromToken({
        receiver,
        yt,
        tokenIn,
        amountIn,
        slippage: "0.01",
        chainId,
        decimals, // Assuming 18 decimals for the token
    });

    if (!response) {
        res.status(500).json({ error: "Failed to mint PT/YT" });
        return;
    }

    res.json(response);
    // return;

    // console.log("response: ", response);

    // const amount = parseUnits(amountIn, decimals);
    // console.log("amount: ", amount);

    // const spender = response.tx.to;
    // console.log("spender: ", spender);

    // const current = token ? await token.allowance(mainAddress, spender) : BigInt(0);
    // console.log("current: ", current);

    // if (token && BigInt(current) <= BigInt(amount)) {
    //     const approveTx = await token.approve(spender, amount);
    //     console.log(`Waiting for approve… ${approveTx.hash}`);
    //     await approveTx.wait();
    // }

    // const ytTokeBalance = await ytToken.balanceOf(mainAddress);
    // console.log("ytTokeBalance: ", ytTokeBalance);

    // // res.json({ response });

    // const sendTx = await signer.sendTransaction(response.tx);
    // console.log(`Waiting for transaction… ${sendTx.hash}`);

    // const mintTX = await sendTx.wait();

    // if (!mintTX) {
    //     res.status(500).json({ error: "Transaction failed" });
    //     return;
    // }

    // console.log("Transaction successful:", mintTX.hash);
    // console.log("Transaction details:", mintTX);

    // const amountInUnits = BigInt(response.data.amountOut);
    // console.log("amountInUnits: ", amountInUnits);

    // const gasLimit = await ytToken.transfer.estimateGas(receiverAddress, amountInUnits);
    // console.log("gasLimit: ", gasLimit);

    // const transferTX = await ytToken.transfer(receiverAddress, amountInUnits, { gasLimit });

    // console.log(`Waiting for transfer… ${transferTX.hash}`);
    // const transferReceipt = await transferTX.wait();

    // if (!transferReceipt) {
    //     res.status(500).json({ error: "Transfer transaction failed" });
    //     return;
    // }

    // console.log("Transfer details:", transferReceipt);

    // res.json({ response, mintTX, transferReceipt });
});

app.post("/api/create-orders", async (req, res): Promise<void> => {
    if (!req.headers.authorization) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const body: {
        firstName: string;
        lastName: string;
        email: string;
        customerIdentifier: string;
        accountIdentifier: string;
        utid: string;
        amount: string;
        customerId: string;
    } = req.body;

    if (
        !body.firstName ||
        !body.lastName ||
        !body.email ||
        !body.customerIdentifier ||
        !body.accountIdentifier ||
        !body.utid ||
        !body.amount ||
        !body.customerId
    ) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }

    const customerMetaFields = await getCustomerMetaFields({ customerId: body.customerId });
    console.log("customerMetaFields: ", customerMetaFields);
    if (!customerMetaFields) {
        res.status(500).json({ error: "Failed to fetch customer meta fields" });
        return;
    }

    const customerMetaField =
        customerMetaFields.metafields[customerMetaFields.metafields.length - 1] &&
        customerMetaFields.metafields[customerMetaFields.metafields.length - 1].key.includes("reward_points") &&
        customerMetaFields.metafields[customerMetaFields.metafields.length - 1].value
            ? customerMetaFields.metafields[customerMetaFields.metafields.length - 1]
            : null;

    if (!customerMetaField) {
        res.status(500).json({ error: "Failed to fetch current reward points meta field" });
        return;
    }

    const isValueLessThanAmount = Number(customerMetaField.value) < Number(body.amount);

    if (isValueLessThanAmount) {
        res.status(400).json({ error: "Insufficient balance" });
        return;
    }

    const newBalance = Number(customerMetaField.value) - Number(body.amount);

    const metaFieldBody = {
        key: `reward_points${Date.now()}`,
        value: newBalance.toString(),
        type: "string",
        namespace: "global",
    };

    const updatedCustomerMetaFieldBody = {
        metafield: metaFieldBody,
    };

    const updatedCustomerMetaField = await setCustomerMetaField({
        customerId: body.customerId,
        body: updatedCustomerMetaFieldBody,
    });

    console.log("updatedCustomerMetaField: ", updatedCustomerMetaField);

    if (!updatedCustomerMetaField) {
        res.status(500).json({ error: "Failed to update customer meta field" });
        return;
    }

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization,
        },
        body: JSON.stringify({
            recipient: {
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
            },
            sendEmail: true,
            customerIdentifier: body.customerIdentifier,
            accountIdentifier: body.accountIdentifier,
            utid: body.utid,
            amount: body.amount,
        }),
    };

    try {
        const response = await fetch(`${process.env.TANGO_API_URL}/orders`, options);

        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).json({ error: errorText });
            return;
        }

        const data = await response.json();

        const shopifyOrderData = {
            order: {
                email: body.email,
                fulfillmentstatus: "fulfilled",
                customer: {
                    first_name: body.firstName,
                    last_name: body.lastName,
                    email: body.email,
                },
                line_items: [
                    {
                        title: data.rewardName,
                        price: data.amountCharged.total,
                        grams: "0",
                        quantity: 1,
                        taxable: body.utid ? false : true,
                        requires_shipping: body.utid ? false : true,
                    },
                ],
                note: `Order ID: ${data.referenceOrderID} utid: ${body.utid}`,
                transactions: [
                    {
                        kind: "sale",
                        status: "success",
                        amount: data.amountCharged.total,
                    },
                ],
                total_tax: 0,
                currency: data.amountCharged.currencyCode,
                send_receipt: true,
            },
        };

        const shopifyResponse = await fetch(`${process.env.SHOPIFY_STOREFRONT_API_URL}/orders.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": process.env.SHOPIFY_API_KEY || "",
            },
            body: JSON.stringify(shopifyOrderData),
        });

        if (!shopifyResponse.ok) {
            const errorText = await shopifyResponse.text();
            res.status(shopifyResponse.status).json({ error: errorText });
            return;
        }

        const shopifyData = await shopifyResponse.json();

        res.json({ data, shopifyData });
    } catch (error) {
        console.error("Error fetching token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
