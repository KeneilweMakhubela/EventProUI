export const initialEvents = [
  { id: 1, name: "Sports Day 2026", venue: "Central Park, NYC", date: "2026-07-15", capacity: 120, registered: 78, status: "published", desc: "Annual outdoor sports festival", location: "40.7829,-73.9654", ticketInfo: "General Admission: $25, VIP: $75, Family Pack: $60" },
  { id: 2, name: "Gala Dinner", venue: "The Grand Hall", date: "2026-08-02", capacity: 200, registered: 145, status: "published", desc: "Charity gala evening", location: "40.7580,-73.9855", ticketInfo: "Single: $150, Couple: $275, Table of 8: $1000" },
  { id: 3, name: "Tech Workshop", venue: "Innovation Hub", date: "2026-07-20", capacity: 40, registered: 38, status: "draft", desc: "AI & Cloud hands-on workshop", location: "37.7749,-122.4194", ticketInfo: "Early Bird: $199, Regular: $299, Student: $99" }
];

export const initialPlayers = [
  { id:1, name:"Sarah Johnson", email:"sarah@example.com", phone:"+1234567890", status:"active", address:"123 Main St, NYC", registeredDate:"2026-06-15" },
  { id:2, name:"Mike Chen", email:"mike@example.com", phone:"+1987654321", status:"active", address:"456 Oak Ave, LA", registeredDate:"2026-06-20" },
  { id:3, name:"Alex Rivera", email:"alex@example.com", phone:"+1122334455", status:"active", address:"789 Pine Rd, Chicago", registeredDate:"2026-06-25" },
  { id:4, name:"Emily Davis", email:"emily@example.com", phone:"+1098765432", status:"active", address:"321 Elm St, Houston", registeredDate:"2026-07-01" },
  { id:5, name:"James Wilson", email:"james@example.com", phone:"+1567890123", status:"inactive", address:"654 Maple Dr, Miami", registeredDate:"2026-05-10" },
  { id:6, name:"Lisa Brown", email:"lisa@example.com", phone:"+1654987321", status:"active", address:"987 Cedar Ln, Seattle", registeredDate:"2026-06-28" }
];

export const initialSponsors = [
  { id: 1, name:"CloudCorp", tier:"Platinum", logo:"☁️", email:"contact@cloudcorp.com", contactPerson:"John Smith", phone:"+1234567890", website:"www.cloudcorp.com", status:"active", contribution:"R50,000" },
  { id: 2, name:"DataStream", tier:"Gold", logo:"📊", email:"info@datastream.com", contactPerson:"Jane Doe", phone:"+1987654321", website:"www.datastream.com", status:"active", contribution:"R25,000" },
  { id: 3, name:"EventPro", tier:"Silver", logo:"🎯", email:"hello@eventpro.com", contactPerson:"Mike Wilson", phone:"+1122334455", website:"www.eventpro.com", status:"active", contribution:"R10,000" }
];

export const initialRsvps = [
  { id: 1, eventId: 1, eventName: "Sports Day 2026", guests: 2, dietaryRequirements: "Vegetarian", specialRequests: "Need accessible seating", status: "confirmed", rsvpDate: "2026-06-20" },
  { id: 2, eventId: 2, eventName: "Gala Dinner", guests: 1, dietaryRequirements: "None", specialRequests: "", status: "confirmed", rsvpDate: "2026-06-25" }
];