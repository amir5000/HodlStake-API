export async function getCustomerMetaFields({ customerId }: { customerId: string }): Promise<any> {
    const url = `${process.env.SHOPIFY_STOREFRONT_API_URL}/customers/${customerId}/metafields.json`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "X-Shopify-Access-Token": process.env.SHOPIFY_API_KEY || "",
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Error fetching customer: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}
