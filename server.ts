import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { mintPyFromToken } from "./pendle/mintPyFromToken";
import { getSigner, getTokenABI } from "./helpers";
import { Contract, parseUnits } from "ethers";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const corsOptions = {
    origin: ["https://hodlstake.myshopify.com"], // Replace with your frontend URL
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({ message: "HodlStake" });
});

app.get("/api", (req, res) => {
    res.json({ message: "HodlStake API" });
});

app.get("/api/auth", async (req, res): Promise<void> => {
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
        const response = await fetch("https://integration-api.tangocard.com/raas/v2/catalogs?verbose=true", options);

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
        const response = await fetch("https://integration-api.tangocard.com/raas/v2/accounts", options);

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
        const response = await fetch("https://integration-api.tangocard.com/raas/v2/customers", options);

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

app.get("/api/markets/:chainId", async (req, res): Promise<void> => {
    const { chainId } = req.params;

    if (!chainId) {
        res.status(400).json({ error: "Missing chainId parameter" });
        return;
    }

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

app.post("/api/mint/:chainId", async (req, res): Promise<void> => {
    const { chainId } = req.params;
    const {
        receiverAddress,
        amountIn,
        tokenInAddress,
        ytAddress,
    }: {
        receiverAddress: string;
        amountIn: string;
        tokenInAddress: string;
        ytAddress: string;
    } = req.body;

    if (!receiverAddress || !amountIn || !tokenInAddress || !ytAddress) {
        res.status(400).json({
            error: `missing ${!receiverAddress ? "receiverAddress " : ""}${!amountIn ? "amountIn " : ""}${!tokenInAddress ? "tokenInAddress " : ""}
${!ytAddress ? "ytAddress " : ""}
            `,
        });
        return;
    }

    const signer = getSigner();
    const mainAddress = await signer.getAddress();
    const token = new Contract(tokenInAddress, getTokenABI(), signer);
    const ytToken = new Contract(ytAddress, getTokenABI(), signer);
    const decimals = await token.decimals();
    const ytTokenDecimals = await ytToken.decimals();

    const response = await mintPyFromToken({
        receiver: mainAddress,
        yt: ytAddress,
        tokenIn: tokenInAddress,
        amountIn,
        slippage: "0.01",
        chainId: chainId,
        decimals: String(decimals) || "18", // Assuming 18 decimals for the token
    });

    if (!response) {
        res.status(500).json({ error: "Failed to mint PT/YT" });
        return;
    }

    console.log("response: ", response);

    const amount = parseUnits(amountIn, decimals);
    console.log("amount: ", amount);

    const spender = response.tx.to;
    console.log("spender: ", spender);

    const current = await token.allowance(mainAddress, spender);
    console.log("current: ", current);

    if (BigInt(current) <= BigInt(amount)) {
        const approveTx = await token.approve(spender, amount);
        console.log(`Waiting for approve… ${approveTx.hash}`);
        await approveTx.wait();
    }

    const ytTokeBalance = await ytToken.balanceOf(mainAddress);
    console.log("ytTokeBalance: ", ytTokeBalance);

    // res.json({ response });

    const sendTx = await signer.sendTransaction(response.tx);
    console.log(`Waiting for transaction… ${sendTx.hash}`);

    const mintTX = await sendTx.wait();

    if (!mintTX) {
        res.status(500).json({ error: "Transaction failed" });
        return;
    }

    console.log("Transaction successful:", mintTX.hash);
    console.log("Transaction details:", mintTX);

    const amountInUnits = BigInt(response.data.amountOut);
    console.log("amountInUnits: ", amountInUnits);

    const gasLimit = await ytToken.transfer.estimateGas(receiverAddress, amountInUnits);
    console.log("gasLimit: ", gasLimit);

    const transferTX = await ytToken.transfer(receiverAddress, amountInUnits, { gasLimit });

    console.log(`Waiting for transfer… ${transferTX.hash}`);
    const transferReceipt = await transferTX.wait();

    if (!transferReceipt) {
        res.status(500).json({ error: "Transfer transaction failed" });
        return;
    }

    console.log("Transfer details:", transferReceipt);

    // res.json({ response, mintTX, transferReceipt });
});

app.post("/api/create-orders", async (req, res): Promise<void> => {
    if (!req.headers.authorization) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const body = req.body;

    if (!body.firstName || !body.lastName || !body.email || !body.customerIdentifier || !body.accountIdentifier || !body.utid || !body.amount) {
        res.status(400).json({ error: "Missing required fields" });
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
        const response = await fetch("https://integration-api.tangocard.com/raas/v2/orders", options);

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

        const shopifyResponse = await fetch("https://hodlstake.myshopify.com/admin/api/2025-01/orders.json", {
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
