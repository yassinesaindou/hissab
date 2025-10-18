  // Adjust import
import { createSupabaseServerClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx'; // Correct ES module import for xlsx


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate dates
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ success: false, message: 'Dates de début et de fin requises', transactions: [] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return new Response(
        JSON.stringify({ success: false, message: 'Période invalide', transactions: [] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Non autorisé', transactions: [] }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: storeData, error: profileError } = await supabase
      .from('profiles')
      .select('storeId, role')
      .eq('userId', user.id)
      .single();

    if (profileError || !storeData) {
      console.error('Error fetching profile:', profileError?.message);
      return new Response(
        JSON.stringify({ success: false, message: 'Profil non trouvé', transactions: [] }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let storeId = storeData.storeId;
    const comparisonColumn = storeData.role === 'employee' ? 'userId' : 'storeId';

    if (storeData.role === 'employee') {
      storeId = user.id;
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq(comparisonColumn, storeId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    if (transactionsError || !transactions) {
      console.error('Error fetching transactions:', transactionsError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Échec durant la recherche des transactions',
          transactions: [],
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Aucune transaction trouvée pour la période sélectionnée',
          transactions: [],
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formattedTransactions = transactions.map((tx) => ({
      ...tx,
      created_at: new Date(tx.created_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedTransactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `transactions_${timestamp}.xlsx`;

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename=${fileName}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Unexpected error fetching transactions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Une erreur s'est produite",
        transactions: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}