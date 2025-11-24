// Shared helper to extract structured event info from AI responses.
export const parseEventFromResponse = (responseText = "") => {
  const eventInfo = {
    title: null,
    location: null,
    address: null,
    date: null,
    time: null,
    price: null,
    tickets: [],
  };

  // Try to extract event title from quoted text
  const titleMatch = responseText.match(/"([^"]+)"/);
  if (titleMatch) {
    eventInfo.title = titleMatch[1];
  }

  // Extract location/address
  const locationMatch = responseText.match(/[-*]\s*\*\*Địa điểm:\*\*\s*([^\n]+)/);
  if (locationMatch) {
    eventInfo.address = locationMatch[1].trim();
    const parts = eventInfo.address.split(/[,→-]/);
    eventInfo.location = parts[0]?.trim() || eventInfo.address;
  }

  // Extract date and time range
  const timeMatch = responseText.match(/[-*]\s*\*\*Thời gian:\*\*\s*([^\n]+)/);
  if (timeMatch) {
    const timeText = timeMatch[1].trim();
    const dateTimeMatch =
      timeText.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{2}:\d{2})\s*→\s*(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{2}:\d{2})/);
    if (dateTimeMatch) {
      eventInfo.date = dateTimeMatch[1];
      eventInfo.time = `${dateTimeMatch[2]} → ${dateTimeMatch[4]}`;
    }
  }

  // Extract price + individual ticket info
  const priceMatch = responseText.match(/[-*]\s*\*\*Giá vé:\*\*\s*([^\n]+)/);
  if (priceMatch) {
    eventInfo.price = priceMatch[1].trim();
    const ticketMatches = priceMatch[1].match(/([^:]+):\s*(\d+(?:,\d+)*(?:\s*VND)?)/g);
    if (ticketMatches) {
      eventInfo.tickets = ticketMatches.map((ticket) => {
        const [name, price] = ticket.split(/:\s*/);
        return {
          name: name.trim(),
          price: price.trim(),
        };
      });
    }
  }

  return eventInfo.title || eventInfo.location ? eventInfo : null;
};


