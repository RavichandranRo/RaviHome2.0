import { useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';

interface ParseResult {
  success: boolean;
  action?: string;
  data?: any;
  message: string;
}

export const parseAICommand = async (text: string): Promise<ParseResult> => {
  const normalized = text.toLowerCase().trim();
  const appStore = useAppStore.getState();
  const notificationStore = useNotificationStore.getState();

  // Helper to extract numbers
  const extractAmount = (str: string): number | null => {
    const matches = str.match(/(?:rs\.?|rupees|amount|fare|of)\s*(\d+(?:\.\d+)?)/i) || str.match(/\b\d+(?:\.\d+)?\b/);
    return matches ? parseFloat(matches[1] || matches[0]) : null;
  };

  // Helper to extract numbers after a specific word
  const extractAfterWord = (str: string, word: string): string | null => {
    const regex = new RegExp(`${word}\\s*(\\w+)`, 'i');
    const matches = str.match(regex);
    return matches ? matches[1] : null;
  };

  // Helper to extract dates
  const extractDate = (str: string): string => {
    if (str.includes('today')) return new Date().toISOString().split('T')[0];
    if (str.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    if (str.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    const dateMatch = str.match(/\b\d{4}-\d{2}-\d{2}\b/) || str.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
    if (dateMatch) {
      try {
        const parsedDate = new Date(dateMatch[0]);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      } catch (e) {}
    }
    return new Date().toISOString().split('T')[0]; // Default to today
  };

  // 1. TRAVEL TICKET
  if (normalized.includes('ticket') || normalized.includes('train') || normalized.includes('bus') || normalized.includes('travel') || normalized.includes('pnr')) {
    const type = normalized.includes('bus') ? 'BUS' : 'TRAIN';
    const pnr = normalized.match(/pnr\s*(\w+)/i)?.[1] || normalized.match(/\b\d{10}\b/)?.[0] || '';
    const fare = extractAmount(normalized) || 0;
    const seatNumber = normalized.match(/seat\s*(\w+)/i)?.[1] || '';
    const coachNumber = normalized.match(/coach\s*(\w+)/i)?.[1] || '';
    const timeDate = extractDate(normalized);
    const time = `${timeDate}T12:00`; // Default to noon if time not parsed
    const paymentMode = normalized.includes('upi') ? 'UPI' : normalized.includes('cash') ? 'Cash' : normalized.includes('card') ? 'Card' : 'Net Banking';
    
    // Validations
    if (!fare) {
      return { success: false, message: `I recognized you wanted to add a ${type.toLowerCase()} ticket, but I couldn't find the fare amount. Please specify the fare (e.g. "fare 500").` };
    }
    if (type === 'TRAIN' && !pnr) {
      return { success: false, message: "For train tickets, a PNR number is required (e.g. \"PNR 1234567890\"). Please provide it." };
    }

    // Add Ticket
    appStore.addTicket({
      type,
      time,
      seatNumber,
      seatType: 'Standard',
      coachNumber,
      fare,
      pnr,
      paymentMode,
      paidBank: 'Punjab National Bank',
    });

    // Add Expense
    appStore.addExpense({
      category: 'Travel',
      amount: fare,
      date: new Date().toLocaleDateString(),
      description: `${type} Ticket Booking - PNR: ${pnr || 'N/A'}, Seat: ${seatNumber || 'N/A'}`,
      type: 'DEBIT',
      paymentMode,
      paidBank: 'Punjab National Bank',
    });

    notificationStore.triggerAnimation(type);
    notificationStore.showNotification('success', 'Ticket Booked Successfully!', `Your ${type.toLowerCase()} ticket with PNR ${pnr || 'N/A'} has been registered.`);
    return { success: true, action: 'Travel Ticket', data: { type, pnr, fare, seatNumber, coachNumber }, message: `Successfully booked a ${type.toLowerCase()} ticket for Rs. ${fare}` };
  }

  // 2. EB READING
  if (normalized.includes('eb') || normalized.includes('electricity') || normalized.includes('reading')) {
    const numbers = normalized.match(/\b\d+(?:\.\d+)?\b/g)?.map(Number) || [];
    let prev = 0;
    let curr = 0;

    if (numbers.length >= 2) {
      // Assuming lower is previous, higher is current, or sequential
      prev = numbers[0];
      curr = numbers[1];
    } else if (numbers.length === 1) {
      curr = numbers[0];
      // Get previous reading from store
      const sortedEntries = [...appStore.ebReadings].sort((a, b) => Number(b.id) - Number(a.id));
      prev = sortedEntries.length > 0 ? sortedEntries[0].currentReading : 0;
    }

    if (curr <= prev) {
      return { success: false, message: `Current reading (${curr}) must be greater than previous reading (${prev}). Please provide valid readings.` };
    }

    if (!curr) {
      return { success: false, message: "Could you please tell me the current reading value (e.g. \"reading 1850\")?" };
    }

    const units = curr - prev;
    // Calculate cost based on TN tariff simulation
    const calculateTNBill = (u: number) => {
      let cost = 0;
      if (u <= 100) cost = 0;
      else if (u <= 500) {
        cost += Math.max(0, Math.min(u - 100, 100)) * 2.25;
        cost += Math.max(0, Math.min(u - 200, 200)) * 4.50;
        cost += Math.max(0, u - 400) * 6.00;
      } else {
        cost += Math.max(0, Math.min(u - 100, 300)) * 4.50;
        cost += Math.max(0, Math.min(u - 400, 100)) * 6.00;
        cost += Math.max(0, Math.min(u - 500, 100)) * 8.00;
        cost += Math.max(0, Math.min(u - 600, 200)) * 9.00;
        cost += Math.max(0, Math.min(u - 800, 200)) * 10.00;
        cost += Math.max(0, u - 1000) * 11.00;
      }
      return cost;
    };
    const cost = calculateTNBill(units);

    appStore.addEBReading({
      previousReading: prev,
      currentReading: curr,
      units,
      amount: cost,
    });

    if (cost > 0) {
      appStore.addExpense({
        category: 'Electricity',
        amount: cost,
        date: new Date().toLocaleDateString(),
        description: `EB Bill for ${units} units (Reading: ${curr})`,
        type: 'DEBIT',
      });
    }

    notificationStore.triggerAnimation('EB');
    notificationStore.showNotification('success', 'EB Reading Recorded!', `Logged current reading: ${curr} (${units} units consumed). Cost: Rs. ${cost.toFixed(2)}`);
    return { success: true, action: 'EB Reading', data: { prev, curr, units, cost }, message: `Logged EB Reading: ${units} units consumed, amount: Rs. ${cost.toFixed(2)}` };
  }

  // 3. TASK COMPLETED
  if (normalized.includes('complete') || normalized.includes('done') || normalized.includes('finish')) {
    // Look for active task matching text
    const words = normalized.split(' ');
    const stopwords = ['complete', 'completed', 'done', 'finish', 'finished', 'task', 'the', 'to', 'mark', 'as'];
    const searchWords = words.filter(w => !stopwords.includes(w));
    const searchQuery = searchWords.join(' ');

    const taskToComplete = appStore.tasks.find(t => t.status === 'PLANNED' && t.title.toLowerCase().includes(searchQuery));

    if (taskToComplete) {
      appStore.updateTaskStatus(taskToComplete.id, 'COMPLETED');
      notificationStore.triggerAnimation('COMPLETED_TASK');
      notificationStore.showNotification('success', 'Task Completed!', `Hurrah! "${taskToComplete.title}" marked completed.`);
      return { success: true, action: 'Complete Task', data: taskToComplete, message: `Completed task: "${taskToComplete.title}"` };
    }
  }

  // 4. PLANNED TASK
  if (normalized.includes('plan') || normalized.includes('todo') || normalized.includes('task') || normalized.includes('schedule')) {
    // Extract title
    const words = normalized.split(' ');
    const indexKeyword = words.findIndex(w => ['plan', 'todo', 'task', 'schedule'].includes(w));
    let titleWords = words.slice(indexKeyword + 1);
    
    // Remove date references
    titleWords = titleWords.filter(w => !['today', 'tomorrow', 'yesterday', 'on', 'at'].includes(w) && !w.match(/\b\d{4}-\d{2}-\d{2}\b/) && !w.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/));
    const title = titleWords.join(' ') || 'New Task';
    const date = extractDate(normalized);

    if (title === 'New Task' || title.length < 3) {
      return { success: false, message: "What task would you like to plan? (e.g. \"plan a task to clean the room\")" };
    }

    appStore.addTask({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      date,
    });

    notificationStore.triggerAnimation('PLANNED_TASK');
    notificationStore.showNotification('success', 'Task Planned!', `Planned task: "${title}" for ${date}`);
    return { success: true, action: 'Planned Task', data: { title, date }, message: `Task planned: "${title}" for ${date}` };
  }

  // 5. DEPOSIT
  if (normalized.includes('deposit') || normalized.includes('fd') || normalized.includes('rd')) {
    const type = normalized.includes('rd') ? 'RD' : 'FD';
    const amount = extractAmount(normalized) || 0;
    const durationDays = parseInt(normalized.match(/(\d+)\s*(?:days|day)/)?.[1] || '365');
    const roi = parseFloat(normalized.match(/roi\s*(\d+(?:\.\d+)?)/)?.[1] || normalized.match(/interest\s*(\d+(?:\.\d+)?)/)?.[1] || '7.0');
    
    // Try matching bank name
    const banks = [
      'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 
      'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'Indian Bank', 
      'Bank of India', 'Federal Bank', 'Yes Bank', 'IndusInd Bank', 'SBI', 'HDFC', 'ICICI'
    ];
    let bank = 'Punjab National Bank';
    for (const b of banks) {
      if (normalized.includes(b.toLowerCase())) {
        if (b === 'SBI') bank = 'State Bank of India';
        else if (b === 'HDFC') bank = 'HDFC Bank';
        else if (b === 'ICICI') bank = 'ICICI Bank';
        else bank = b;
        break;
      }
    }

    if (!amount) {
      return { success: false, message: `Could you specify the principal amount for the ${type}? (e.g. "FD of 10000 rupees")` };
    }

    const startDate = new Date().toISOString().split('T')[0];
    const maturityDate = new Date(new Date(startDate).getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    appStore.addDeposit({
      type,
      bank,
      amount,
      durationDays,
      roi,
      startDate,
      maturityDate,
      autoRenewal: false,
    });

    notificationStore.triggerAnimation('DEPOSIT');
    notificationStore.showNotification('success', 'Deposit Saved!', `${type} of Rs. ${amount} opened in ${bank}.`);
    return { success: true, action: 'Deposit', data: { type, bank, amount, durationDays, roi }, message: `Opened ${type} of Rs. ${amount} at ${bank}` };
  }

  // 6. PAYMENTS (CREDIT/DEBIT)
  if (normalized.includes('spend') || normalized.includes('spent') || normalized.includes('paid') || normalized.includes('debit') || normalized.includes('expense') || normalized.includes('income') || normalized.includes('received') || normalized.includes('earned') || normalized.includes('salary')) {
    const isCredit = normalized.includes('income') || normalized.includes('received') || normalized.includes('earned') || normalized.includes('salary');
    const type = isCredit ? 'CREDIT' : 'DEBIT';
    const amount = extractAmount(normalized) || 0;
    
    if (!amount) {
      return { success: false, message: "How much did you spend or receive? Please specify the amount (e.g. \"spent 500 rupees\")." };
    }

    // Try extracting category
    let category = isCredit ? 'Salary' : 'Bills';
    const categories = ['food', 'dinner', 'groceries', 'rent', 'travel', 'shopping', 'medicine', 'entertainment', 'utilities'];
    for (const cat of categories) {
      if (normalized.includes(cat)) {
        category = cat.charAt(0).toUpperCase() + cat.slice(1);
        break;
      }
    }

    // Try extracting description
    const description = normalized.replace(/spent|spend|paid|received|earned|salary|debit|credit|amount|of|rupees|rs/g, '').trim() || (isCredit ? 'Income entry' : 'Expense entry');

    const paymentMode = normalized.includes('upi') ? 'UPI' : normalized.includes('cash') ? 'Cash' : normalized.includes('card') ? 'Card' : 'Net Banking';
    const date = new Date().toLocaleDateString();

    appStore.addExpense({
      category,
      amount,
      date,
      description: description.charAt(0).toUpperCase() + description.slice(1),
      type,
      paymentMode,
      paidBank: 'Punjab National Bank',
    });

    notificationStore.triggerAnimation(type === 'CREDIT' ? 'PAYMENT_CREDIT' : 'PAYMENT_DEBIT');
    notificationStore.showNotification('success', `${isCredit ? 'Income' : 'Expense'} Recorded!`, `${category}: Rs. ${amount} logged via ${paymentMode}`);
    return { success: true, action: type, data: { category, amount, description, paymentMode }, message: `Logged ${type.toLowerCase()} of Rs. ${amount} for ${category}` };
  }

  // FALLBACK
  return {
    success: false,
    message: "I couldn't quite map that to an action. You can try saying things like:\n" +
      "• 'Spent 500 for groceries on UPI'\n" +
      "• 'Plan task clean study table tomorrow'\n" +
      "• 'Book train ticket fare 450 PNR 4239857211'\n" +
      "• 'EB reading 1450 units' (assuming previous was 1200)\n" +
      "• 'FD deposit of 20000 in SBI for 365 days'"
  };
};
