export async function setCustomerMetaField({ customerId, body }: { customerId: string; body: any }): Promise<any> {
    const url = `${process.env.SHOPIFY_STOREFRONT_API_URL}/customers/${customerId}/metafields.json`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-Shopify-Access-Token": process.env.SHOPIFY_API_KEY || "",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Error setting customer metafield: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}
