export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '₹0';
  const parsed = Number(amount);
  if (isNaN(parsed)) return '₹0';
  
  const isNegative = parsed < 0;
  const num = Math.round(Math.abs(parsed));
  const str = num.toString();
  
  let result = '';
  if (str.length <= 3) {
    result = str;
  } else {
    const last3 = str.slice(-3);
    const rest = str.slice(0, -3);
    const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = formatted + ',' + last3;
  }
  
  return (isNegative ? '-' : '') + '₹' + result;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

export function getPlan(totalInvested: number): { name: 'STARTER' | 'GROWTH' | 'FORTUNE'; rate: number } {
  if (totalInvested >= 3100000) return { name: 'FORTUNE', rate: 7 };
  if (totalInvested >= 1100000) return { name: 'GROWTH', rate: 6 };
  return { name: 'STARTER', rate: 5 };
}
