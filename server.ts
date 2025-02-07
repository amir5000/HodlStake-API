import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const corsOptions = {
    origin: ['https://hodlstake.myshopify.com'], // Replace with your frontend URL
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'HODL SERVER' });
});

// @ts-ignore
app.get('/auth', async (req: Request, res: Response) => {
    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            scope: 'raas.all',
            audience: 'https://api.tangocard.com/',
            grant_type: 'client_credentials',
            client_id: process.env.TANGO_CLIENT_ID || '',
            client_secret: process.env.TANGO_CLIENT_SECRET || '',
        }),
    };

    try {
        const response = await fetch(
            'https://sandbox-auth.tangocard.com/oauth/token',
            options
        );

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @ts-ignore
app.get('/catalogs', async (req: Request, res: Response) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: req.headers.authorization,
        },
    };

    try {
        const response = await fetch(
            'https://integration-api.tangocard.com/raas/v2/catalogs?verbose=true',
            options
        );

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @ts-ignore
app.get('/accounts', async (req: Request, res: Response) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: req.headers.authorization,
        },
    };

    try {
        const response = await fetch(
            'https://integration-api.tangocard.com/raas/v2/accounts',
            options
        );

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @ts-ignore
app.get('/customers', async (req: Request, res: Response) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: req.headers.authorization,
        },
    };

    try {
        const response = await fetch(
            'https://integration-api.tangocard.com/raas/v2/customers',
            options
        );

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @ts-ignore
app.post('/create-orders', async (req: Request, res: Response) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
        const response = await fetch(
            'https://integration-api.tangocard.com/raas/v2/orders',
            options
        );

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();

        const shopifyOrderData = {
            order: {
                email: body.email,
                fulfillmentstatus: 'fulfilled',
                customer: {
                    first_name: body.firstName,
                    last_name: body.lastName,
                    email: body.email,
                },
                line_items: [
                    {
                        title: data.rewardName,
                        price: data.amountCharged.total,
                        grams: '0',
                        quantity: 1,
                        taxable: body.utid ? false : true,
                        requires_shipping: body.utid ? false : true,
                    },
                ],
                note: `Order ID: ${data.referenceOrderID} utid: ${body.utid}`,
                transactions: [
                    {
                        kind: 'sale',
                        status: 'success',
                        amount: data.amountCharged.total,
                    },
                ],
                total_tax: 0,
                currency: data.amountCharged.currencyCode,
                send_receipt: true,
            },
        };

        const shopifyResponse = await fetch(
            'https://hodlstake.myshopify.com/admin/api/2025-01/orders.json',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': process.env.SHOPIFY_API_KEY || '',
                },
                body: JSON.stringify(shopifyOrderData),
            }
        );

        if (!shopifyResponse.ok) {
            const errorText = await shopifyResponse.text();
            return res
                .status(shopifyResponse.status)
                .json({ error: errorText });
        }

        const shopifyData = await shopifyResponse.json();

        res.json({ data, shopifyData });
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
