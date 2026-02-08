// Shopify Admin API Client - Custom App (permanent tokens)
// Docs: https://shopify.dev/docs/api/admin-rest

const SHOPIFY_API_VERSION = '2024-10';

// ============ TYPES ============

interface ShopifyRequestOptions {
  storeUrl: string;
  accessToken: string;
  endpoint: string;
  params?: Record<string, string>;
}

interface ShopifyShopInfo {
  name: string;
  email: string;
  domain: string;
  myshopify_domain: string;
  currency: string;
  plan_name: string;
  country_name: string;
  timezone: string;
}

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  total_price: string;
  subtotal_price: string;
  total_discounts: string;
  total_shipping_price_set: { shop_money: { amount: string } };
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  line_items: Array<{
    title: string;
    quantity: number;
    price: string;
    variant_title: string;
    sku: string;
  }>;
  source_name: string;
  note: string | null;
  tags: string;
  created_at: string;
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ShopifyProduct {
  id: number;
  title: string;
  product_type: string;
  vendor: string;
  status: string;
  tags: string;
  variants: Array<{
    price: string;
    inventory_quantity: number;
    title: string;
    sku: string;
  }>;
  image: { src: string } | null;
}

interface ShopifyCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  orders_count: number;
  total_spent: string;
  tags: string;
  created_at: string;
  default_address?: {
    city: string;
    province: string;
    country: string;
  };
}

// ============ HELPERS ============

export function normalizeStoreDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '');
  // Remove trailing paths
  domain = domain.replace(/\/.*$/, '');
  // Add .myshopify.com if not present
  if (!domain.includes('.myshopify.com')) {
    domain = domain.replace(/\.myshopify$/, '');
    domain = `${domain}.myshopify.com`;
  }
  return domain;
}

function parseLinkHeader(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

// ============ API CLIENT ============

async function shopifyFetch(options: ShopifyRequestOptions): Promise<Response> {
  const baseUrl = `https://${options.storeUrl}/admin/api/${SHOPIFY_API_VERSION}/${options.endpoint}`;
  const url = new URL(baseUrl);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    const response = await fetch(url.toString(), {
      headers: {
        'X-Shopify-Access-Token': options.accessToken,
        'Content-Type': 'application/json',
      },
    });

    // Check rate limit bucket
    const callLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
    if (callLimit) {
      const [used, max] = callLimit.split('/').map(Number);
      if (used >= max - 4) {
        // Approaching limit, pause
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (response.status === 429) {
      const retryAfter = parseFloat(response.headers.get('Retry-After') || '2');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      retries++;
      continue;
    }

    if (response.status === 401) {
      throw new Error('Token de acesso invalido ou expirado. Verifique as credenciais do Custom App.');
    }

    if (response.status === 404) {
      throw new Error('Loja nao encontrada. Verifique o dominio informado.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Shopify (${response.status}): ${errorText}`);
    }

    return response;
  }

  throw new Error('API Shopify: limite de tentativas excedido. Tente novamente mais tarde.');
}

async function fetchAllPages<T>(
  storeUrl: string,
  accessToken: string,
  endpoint: string,
  resourceKey: string,
  params?: Record<string, string>
): Promise<T[]> {
  const allItems: T[] = [];

  // First request
  const firstResponse = await shopifyFetch({
    storeUrl,
    accessToken,
    endpoint,
    params: { limit: '250', ...params },
  });

  const firstData = await firstResponse.json();
  allItems.push(...(firstData[resourceKey] || []));

  // Follow pagination via Link header
  let nextPageUrl = parseLinkHeader(firstResponse.headers.get('Link'));

  while (nextPageUrl) {
    await new Promise(resolve => setTimeout(resolve, 500));

    let retries = 0;
    let response: Response | null = null;

    while (retries <= 3) {
      response = await fetch(nextPageUrl, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 429) {
        const retryAfter = parseFloat(response.headers.get('Retry-After') || '2');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        retries++;
        continue;
      }
      break;
    }

    if (!response || !response.ok) break;

    const data = await response.json();
    allItems.push(...(data[resourceKey] || []));
    nextPageUrl = parseLinkHeader(response.headers.get('Link'));
  }

  return allItems;
}

// ============ PUBLIC FUNCTIONS ============

export async function verifyShopifyConnection(storeUrl: string, accessToken: string): Promise<ShopifyShopInfo> {
  const response = await shopifyFetch({
    storeUrl,
    accessToken,
    endpoint: 'shop.json',
  });

  const data = await response.json();
  return data.shop;
}

export interface SyncedOrder {
  shopify_order_id: string;
  order_number: string;
  email_cliente: string;
  nome_cliente: string;
  valor_total: number;
  valor_subtotal: number;
  valor_desconto: number;
  valor_frete: number;
  valor_impostos: number;
  moeda: string;
  status_financeiro: string;
  status_fulfillment: string;
  itens_json: string;
  quantidade_itens: number;
  canal_vendas: string;
  nota: string;
  tags: string;
  data_pedido: string;
}

export async function fetchShopifyOrders(
  storeUrl: string,
  accessToken: string,
  sinceDate?: string
): Promise<SyncedOrder[]> {
  const params: Record<string, string> = {
    status: 'any',
    limit: '250',
  };

  if (sinceDate) {
    params.updated_at_min = sinceDate;
  }

  const orders = await fetchAllPages<ShopifyOrder>(
    storeUrl,
    accessToken,
    'orders.json',
    'orders',
    params
  );

  return orders.map((order) => {
    const customerName = order.customer
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
      : '';

    const lineItems = order.line_items.map((item) => ({
      titulo: item.title,
      quantidade: item.quantity,
      preco: parseFloat(item.price),
      variante: item.variant_title,
      sku: item.sku,
    }));

    return {
      shopify_order_id: String(order.id),
      order_number: order.name,
      email_cliente: order.email || order.customer?.email || '',
      nome_cliente: customerName,
      valor_total: parseFloat(order.total_price) || 0,
      valor_subtotal: parseFloat(order.subtotal_price) || 0,
      valor_desconto: parseFloat(order.total_discounts) || 0,
      valor_frete: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0') || 0,
      valor_impostos: parseFloat(order.total_tax) || 0,
      moeda: order.currency || 'BRL',
      status_financeiro: order.financial_status || '',
      status_fulfillment: order.fulfillment_status || 'unfulfilled',
      itens_json: JSON.stringify(lineItems),
      quantidade_itens: order.line_items.reduce((sum, item) => sum + item.quantity, 0),
      canal_vendas: order.source_name || '',
      nota: order.note || '',
      tags: order.tags || '',
      data_pedido: order.created_at.split('T')[0],
    };
  });
}

export interface SyncedProduct {
  shopify_product_id: string;
  titulo: string;
  tipo_produto: string;
  vendor: string;
  status: string;
  tags: string;
  preco_min: number;
  preco_max: number;
  estoque_total: number;
  variantes_json: string;
  quantidade_variantes: number;
  imagem_url: string;
}

export async function fetchShopifyProducts(
  storeUrl: string,
  accessToken: string
): Promise<SyncedProduct[]> {
  const products = await fetchAllPages<ShopifyProduct>(
    storeUrl,
    accessToken,
    'products.json',
    'products',
    { limit: '250' }
  );

  return products.map((product) => {
    const prices = product.variants.map((v) => parseFloat(v.price) || 0);
    const totalStock = product.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);

    const variantes = product.variants.map((v) => ({
      titulo: v.title,
      preco: parseFloat(v.price) || 0,
      estoque: v.inventory_quantity || 0,
      sku: v.sku || '',
    }));

    return {
      shopify_product_id: String(product.id),
      titulo: product.title,
      tipo_produto: product.product_type || '',
      vendor: product.vendor || '',
      status: product.status || 'active',
      tags: product.tags || '',
      preco_min: prices.length > 0 ? Math.min(...prices) : 0,
      preco_max: prices.length > 0 ? Math.max(...prices) : 0,
      estoque_total: totalStock,
      variantes_json: JSON.stringify(variantes),
      quantidade_variantes: product.variants.length,
      imagem_url: product.image?.src || '',
    };
  });
}

export interface SyncedCustomer {
  shopify_customer_id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  pais: string;
  total_pedidos: number;
  total_gasto: number;
  tags: string;
}

export async function fetchShopifyCustomers(
  storeUrl: string,
  accessToken: string
): Promise<SyncedCustomer[]> {
  const customers = await fetchAllPages<ShopifyCustomer>(
    storeUrl,
    accessToken,
    'customers.json',
    'customers',
    { limit: '250' }
  );

  return customers.map((customer) => ({
    shopify_customer_id: String(customer.id),
    nome: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
    email: customer.email || '',
    telefone: customer.phone || '',
    cidade: customer.default_address?.city || '',
    estado: customer.default_address?.province || '',
    pais: customer.default_address?.country || '',
    total_pedidos: customer.orders_count || 0,
    total_gasto: parseFloat(customer.total_spent) || 0,
    tags: customer.tags || '',
  }));
}
