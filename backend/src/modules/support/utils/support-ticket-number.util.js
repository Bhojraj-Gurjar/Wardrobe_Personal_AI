export function formatTicketNumber(year, sequence) {
  const padded = String(sequence).padStart(6, '0');
  return `WAI-${year}-${padded}`;
}

export async function generateNextTicketNumber(prisma) {
  const year = new Date().getFullYear();
  const prefix = `WAI-${year}-`;

  const latest = await prisma.supportTicket.findFirst({
    where: {
      ticket_number: { startsWith: prefix },
    },
    orderBy: { ticket_number: 'desc' },
    select: { ticket_number: true },
  });

  let nextSequence = 1;

  if (latest?.ticket_number) {
    const parts = latest.ticket_number.split('-');
    const lastSequence = Number.parseInt(parts[2], 10);

    if (!Number.isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  return formatTicketNumber(year, nextSequence);
}
