
import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  purchase_datetime: { type: Date, default: Date.now },
  amount: Number,
  purchaser: String
});

const TicketModel = mongoose.model('Ticket', ticketSchema);

export default TicketModel;
