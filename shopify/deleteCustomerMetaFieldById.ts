export async function deleteCustomerMetaFieldById({ customerId, metafieldId }: { customerId: string; metafieldId: string }): Promise<any> {
    const url = `${process.env.SHOPIFY_STOREFRONT_API_URL}/customers/${customerId}/metafields/${metafieldId}.json`;

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "X-Shopify-Access-Token": process.env.SHOPIFY_API_KEY || "",
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Error deleting customer metafield: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}
