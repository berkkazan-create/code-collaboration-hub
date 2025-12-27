import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the requester is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(token);
    
    if (!requestingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requester is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = requestingUser.id;

    // Delete existing data (order matters for foreign keys)
    await supabaseAdmin.from("stock_movements").delete().eq("user_id", userId);
    await supabaseAdmin.from("transactions").delete().eq("user_id", userId);
    await supabaseAdmin.from("products").delete().eq("user_id", userId);
    await supabaseAdmin.from("accounts").delete().eq("user_id", userId);
    await supabaseAdmin.from("bank_accounts").delete().eq("user_id", userId);
    await supabaseAdmin.from("categories").delete().eq("user_id", userId);

    // Create demo categories
    const categories = [
      { name: "Elektronik", color: "#3b82f6", user_id: userId },
      { name: "Bilgisayar", color: "#8b5cf6", user_id: userId },
      { name: "Aksesuar", color: "#10b981", user_id: userId },
      { name: "Yedek Parça", color: "#f59e0b", user_id: userId },
      { name: "Kırtasiye", color: "#ef4444", user_id: userId },
    ];
    await supabaseAdmin.from("categories").insert(categories);

    // Create demo products with dual currency
    const products = [
      { name: "iPhone 15 Pro 256GB", sku: "IPH15P-256", description: "Apple iPhone 15 Pro", quantity: 25, unit: "adet", purchase_price: 45000, sale_price: 52000, min_stock_level: 5, category: "Elektronik", barcode: "8901234567890", user_id: userId },
      { name: "Samsung Galaxy S24", sku: "SGS24-128", description: "Samsung Galaxy S24 128GB", quantity: 30, unit: "adet", purchase_price: 32000, sale_price: 38000, min_stock_level: 10, category: "Elektronik", barcode: "8901234567891", user_id: userId },
      { name: "MacBook Air M3", sku: "MBA-M3-256", description: "Apple MacBook Air M3 256GB", quantity: 12, unit: "adet", purchase_price: 55000, sale_price: 65000, min_stock_level: 3, category: "Bilgisayar", barcode: "8901234567892", user_id: userId },
      { name: "Dell Monitor 27\" 4K", sku: "DELL-27-4K", description: "Dell UltraSharp 27\" 4K", quantity: 18, unit: "adet", purchase_price: 8500, sale_price: 10500, min_stock_level: 5, category: "Bilgisayar", barcode: "8901234567893", user_id: userId },
      { name: "AirPods Pro 2", sku: "APP2-2023", description: "Apple AirPods Pro 2. Nesil", quantity: 45, unit: "adet", purchase_price: 5500, sale_price: 7000, min_stock_level: 10, category: "Aksesuar", barcode: "8901234567894", user_id: userId },
      { name: "Logitech MX Master 3S", sku: "LOG-MXM3S", description: "Profesyonel kablosuz mouse", quantity: 35, unit: "adet", purchase_price: 2800, sale_price: 3500, min_stock_level: 8, category: "Aksesuar", barcode: "8901234567895", user_id: userId },
      { name: "USB-C Hub 7in1", sku: "USBC-HUB-7", description: "USB-C 7-in-1 Multiport Hub", quantity: 60, unit: "adet", purchase_price: 450, sale_price: 650, min_stock_level: 15, category: "Aksesuar", barcode: "8901234567896", user_id: userId },
      { name: "Fren Balatası Set", sku: "FRN-BAL-01", description: "Ön fren balata seti", quantity: 40, unit: "takım", purchase_price: 850, sale_price: 1200, min_stock_level: 10, category: "Yedek Parça", barcode: "8901234567897", user_id: userId },
      { name: "Yağ Filtresi", sku: "YAG-FLT-01", description: "Motor yağ filtresi", quantity: 100, unit: "adet", purchase_price: 120, sale_price: 180, min_stock_level: 20, category: "Yedek Parça", barcode: "8901234567898", user_id: userId },
      { name: "Hava Filtresi", sku: "HVA-FLT-01", description: "Motor hava filtresi", quantity: 80, unit: "adet", purchase_price: 200, sale_price: 300, min_stock_level: 15, category: "Yedek Parça", barcode: "8901234567899", user_id: userId },
      { name: "A4 Kağıt 500'lü", sku: "KAGIT-A4-500", description: "80gr A4 fotokopi kağıdı", quantity: 200, unit: "paket", purchase_price: 85, sale_price: 120, min_stock_level: 50, category: "Kırtasiye", user_id: userId },
      { name: "Ataş Kutusu", sku: "ATAS-100", description: "Metal ataş 100lü kutu", quantity: 150, unit: "kutu", purchase_price: 15, sale_price: 25, min_stock_level: 30, category: "Kırtasiye", user_id: userId },
    ];
    await supabaseAdmin.from("products").insert(products);

    // Create demo accounts (customers & suppliers)
    const accounts = [
      { name: "ABC Teknoloji A.Ş.", type: "customer", email: "info@abcteknoloji.com", phone: "0212 555 1234", address: "İstanbul, Türkiye", tax_number: "1234567890", balance: 15000, currency: "TRY", user_id: userId },
      { name: "XYZ Yazılım Ltd.", type: "customer", email: "satis@xyz.com", phone: "0216 444 5678", address: "Ankara, Türkiye", tax_number: "0987654321", balance: 8500, currency: "TRY", user_id: userId },
      { name: "Global Tech Inc.", type: "customer", email: "order@globaltech.com", phone: "+1 555 123 4567", address: "New York, USA", balance: 2500, currency: "USD", user_id: userId },
      { name: "Mega Bilişim", type: "customer", email: "siparis@megabilisim.com", phone: "0232 333 9999", address: "İzmir, Türkiye", balance: 22000, currency: "TRY", user_id: userId },
      { name: "Apple Türkiye", type: "supplier", email: "b2b@apple.com.tr", phone: "0212 999 0000", address: "İstanbul, Türkiye", balance: -125000, currency: "TRY", user_id: userId },
      { name: "Samsung Türkiye", type: "supplier", email: "kurumsal@samsung.com.tr", phone: "0212 888 0000", address: "İstanbul, Türkiye", balance: -85000, currency: "TRY", user_id: userId },
      { name: "Tech Parts USA", type: "supplier", email: "orders@techparts.com", phone: "+1 800 555 0000", address: "Los Angeles, USA", balance: -3500, currency: "USD", user_id: userId },
      { name: "Oto Yedek Parça A.Ş.", type: "supplier", email: "siparis@otoyedek.com", phone: "0312 777 5555", address: "Ankara, Türkiye", balance: -45000, currency: "TRY", user_id: userId },
    ];
    await supabaseAdmin.from("accounts").insert(accounts);

    // Create demo bank accounts
    const bankAccounts = [
      { name: "İş Bankası Ticari", bank_name: "Türkiye İş Bankası", iban: "TR12 0006 4000 0011 2233 4455 66", account_number: "11223344", balance: 125000, currency: "TRY", user_id: userId },
      { name: "Garanti BBVA", bank_name: "Garanti BBVA", iban: "TR98 0006 2000 0022 3344 5566 77", account_number: "22334455", balance: 85000, currency: "TRY", user_id: userId },
      { name: "Yapı Kredi Döviz", bank_name: "Yapı Kredi", iban: "TR45 0006 7000 0033 4455 6677 88", account_number: "33445566", balance: 5000, currency: "USD", user_id: userId },
    ];
    await supabaseAdmin.from("bank_accounts").insert(bankAccounts);

    // Get inserted bank account IDs for transactions
    const { data: insertedBankAccounts } = await supabaseAdmin
      .from("bank_accounts")
      .select("id, name")
      .eq("user_id", userId);

    const isBankasi = insertedBankAccounts?.find(b => b.name === "İş Bankası Ticari");
    const garanti = insertedBankAccounts?.find(b => b.name === "Garanti BBVA");
    const yapiKredi = insertedBankAccounts?.find(b => b.name === "Yapı Kredi Döviz");

    // Get inserted account IDs
    const { data: insertedAccounts } = await supabaseAdmin
      .from("accounts")
      .select("id, name")
      .eq("user_id", userId);

    const abcTeknoloji = insertedAccounts?.find(a => a.name === "ABC Teknoloji A.Ş.");
    const xyzYazilim = insertedAccounts?.find(a => a.name === "XYZ Yazılım Ltd.");
    const globalTech = insertedAccounts?.find(a => a.name === "Global Tech Inc.");

    // Create demo transactions (last 6 months)
    const today = new Date();
    const transactions = [];
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = monthDate.toISOString().split("T")[0];
      
      // Income transactions
      transactions.push(
        { type: "sale", amount: 52000 + Math.random() * 20000, description: "iPhone satışı", date: monthStr, payment_method: "bank", bank_account_id: isBankasi?.id, account_id: abcTeknoloji?.id, currency: "TRY", user_id: userId },
        { type: "sale", amount: 38000 + Math.random() * 15000, description: "Samsung satışı", date: monthStr, payment_method: "bank", bank_account_id: garanti?.id, account_id: xyzYazilim?.id, currency: "TRY", user_id: userId },
        { type: "income", amount: 2500 + Math.random() * 1000, description: "Servis geliri", date: monthStr, payment_method: "cash", currency: "TRY", user_id: userId },
        { type: "sale", amount: 1500 + Math.random() * 500, description: "Export sale", date: monthStr, payment_method: "bank", bank_account_id: yapiKredi?.id, account_id: globalTech?.id, currency: "USD", user_id: userId },
      );
      
      // Expense transactions
      transactions.push(
        { type: "purchase", amount: 45000 + Math.random() * 10000, description: "Ürün alımı - Apple", date: monthStr, payment_method: "bank", bank_account_id: isBankasi?.id, currency: "TRY", user_id: userId },
        { type: "expense", amount: 5000 + Math.random() * 2000, description: "Kira gideri", date: monthStr, payment_method: "bank", bank_account_id: garanti?.id, currency: "TRY", user_id: userId },
        { type: "expense", amount: 2000 + Math.random() * 1000, description: "Elektrik ve fatura", date: monthStr, payment_method: "cash", currency: "TRY", user_id: userId },
        { type: "purchase", amount: 800 + Math.random() * 200, description: "Import purchase", date: monthStr, payment_method: "bank", bank_account_id: yapiKredi?.id, currency: "USD", user_id: userId },
      );
    }
    
    await supabaseAdmin.from("transactions").insert(transactions);

    // Create some stock movements
    const { data: insertedProducts } = await supabaseAdmin
      .from("products")
      .select("id, name, quantity")
      .eq("user_id", userId);

    const stockMovements = [];
    for (const product of insertedProducts?.slice(0, 6) || []) {
      stockMovements.push(
        { product_id: product.id, type: "in", quantity: 20, previous_quantity: product.quantity - 20, new_quantity: product.quantity, reason: "İlk stok girişi", user_id: userId },
        { product_id: product.id, type: "out", quantity: 5, previous_quantity: product.quantity, new_quantity: product.quantity - 5, reason: "Satış", user_id: userId },
      );
    }
    await supabaseAdmin.from("stock_movements").insert(stockMovements);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Demo veriler başarıyla oluşturuldu",
      stats: {
        categories: categories.length,
        products: products.length,
        accounts: accounts.length,
        bankAccounts: bankAccounts.length,
        transactions: transactions.length,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
