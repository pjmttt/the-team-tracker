export const EMAIL_TEMPLATE_TYPE = {
	USER: {
		label: "User Template",
		value: 0
	},
	MANAGER: {
		label: "Manager Template",
		value: 1,
		hideFromSettings: true,
	},
	FORGOT_PASSWORD: {
		label: "Forgot Password Template",
		value: 2
	},
	MAINTENANCE: {
		label: "Maintenance Template",
		value: 3
	},
	INVITATION: {
		label: "Invitation Template",
		value: 4
	},
	LEAVE_REQUEST: {
		label: "Time Off Template",
		value: 5
	},
	LEAVE_RESULT: {
		label: "Time Off Result Template",
		value: 6
	},
	AVAILABILITY: {
		label: "Availability Request Template",
		value: 7
	},
	AVAILABILITY_RESULT: {
		label: "Availability Result Template",
		value: 8
	},
	SCHEDULE_TEMPLATE: {
		label: "Schedule Template",
		value: 9
	},
	SCHEDULE_TRADE_POST: {
		label: "Trade Posted Template",
		value: 10
	},
	SCHEDULE_TRADE_REQUEST: {
		label: "Trade Requested Template",
		value: 11
	},
	SCHEDULE_TRADE_RESPONSE: {
		label: "Trade Response Template",
		value: 12
	},
	SCHEDULE_TRADE_APPROVE: {
		label: "Trade Request Approve/Deny",
		value: 13
	},
	SCHEDULE_TRADE_DECLINED: {
		label: "Trade Request Declined",
		value: 14
	},
	USER_CLOCK: {
		label: "Hours Request Template",
		value: 15
	},
	LATE_CLOCK_IN: {
		label: "Late Clock In Template",
		value: 16
	},
	USER_CLOCK_STATUS: {
		label: "Hours Response Template",
		value: 17
	},
	INVENTORY_NEEDED: {
		label: "Inventory Needed",
		value: 18
	}
}

// copy from api
export const ROLE = {
	MANAGER: {
		label: "Manager",
		value: 100,
	},
	INVENTORY: {
		label: "Inventory",
		value: 500,
	},
	ADMIN: {
		label: "Admin",
		value: 600,
	},
	MAINTENANCE_REQUESTS: {
		label: "Maintenance Requests",
		value: 900,
	},
	SCHEDULING: {
		label: "Scheduling",
		value: 1000,
	},
}


export const MODULE = {
	DUTIES: {
		value: 0,
	},
	SCHEDULING: {
		value: 1,
	},
	INVENTORY: {
		value: 2,
	},
	MAINTENANCE_REQUESTS: {
		value: 3,
	},
}

// copy from api
export const NOTIFICATION = {
	DAILY_REPORT: {
		label: "Daily Report",
		value: 500,
		description: "Send daily report to employee with the results of their duties for that day."
	},
	TRADE_REQUESTS: {
		label: "Trade Requests",
		value: 600,
		description: "Notify when a trade has been posted."
	},
	INVENTORY: {
		label: "Inventory Needed",
		value: 2000,
		description: "Notify when inventory drops below the minimum quantity."
	}
}

export const DAYS = [
	{ name: "Sunday", value: 0 },
	{ name: "Monday", value: 1 },
	{ name: "Tuesday", value: 2 },
	{ name: "Wednesday", value: 3 },
	{ name: "Thursday", value: 4 },
	{ name: "Friday", value: 5 },
	{ name: "Saturday", value: 6 },
]

export class Enum {
	label: string;
	value: number;
}

export const TRANSACTION_TYPE = {
	RESTOCK: 0,
	USAGE: 1,
	RECONCILIATION: 2
}

// copy from api
export const TRADE_STATUS = {
	SUBMITTED: {
		label: "Submitted",
		value: 0
	},
	REQUESTED: {
		label: "Trade Requested",
		value: 1
	},
	PENDING_APPROVAL: {
		label: "Pending Approval",
		value: 2
	},
	APPROVED: {
		label: "Approved",
		value: 3
	},
	DENIED: {
		label: "Denied",
		value: 4
	},
};

export const DIFFICULTY_LEVEL = [
	{ name: 'Easy', value: 1 },
	{ name: 'Medium', value: 2 },
	{ name: 'Difficult', value: 3 },
];


export const COLORS = {
	Black:'#000000',
	AquaGreen:'#03BB85',
	BronzeYellow:'#A78B00',
	Cocoa:'#5E4330',
	PinkFlamingo:'#FC74FD',
	Blue:'#0000FF',
	CoolGray:'#788193',
	Cerulean:'#006A93',
	PurpleHeart:'#652DC1',
	Brown:'#AF593E',
	Gray:'#8B8680',
	DarkBrown:'#514E49',
	Gold:'#867200',
	Green:'#00FF00',
	JadeGreen:'#0A6B0D',
	GreenBlue:'#1164B4',
	HarvestGold:'#E2B631',
	RazzleDazzleRose:'#EE34D2',
	Orange:'#FF861F',
	LightBlue:'#8FD8D8',
	LemonYellow:'#F4FA9F',
	LimeGreen:'#6EEB6E',
	RedViolet:'#BB3385',
	Red:'#FF0000',
	LightBrown:'#A36F40',
	Olive:'#497E48',
	GrannySmithApple:'#9DE093',
	RoyalPurple:'#6B3FA0',
	RedOrange:'#FF3F34',
	Magenta:'#F653A6',
	Maroon:'#C32148',
	SkyBlue:'#76D7EA',
	Mahogany:'#CA3435',
	PineGreen:'#01796F',
	NavyBlue:'#00003B',
	RubyRed:'#E6335F',
	BlueBolt:'#00B9FB',
	Indigo:'#4F69C6',
	Violet:'#8359A3',
	Peach:'#FFCBA4',
	Raspberry:'#E90067',
	Orchid:'#BC6CAC',
	TrueBlue:'#03228E',
	White:'#FFFFFF',
	Pink:'#FF99CC',
	Salmon:'#FF91A4',
	Yellow:'#FFFF00',
	Tan:'#FA9D5A',
	Slate:'#404E5A',
	BrickRed:'#C62D42',
	YellowGreen:'#C5E17A',
	YellowOrange:'#FFAE42',
	Turquoise:'#6CDAE7',
	Silver:'#A6AAAE',
	Cantaloupe:'#FA9C44',
	TropicalRainforest:'#00755E',
	Teal:'#0086A7',
}

export const FILTER_DELAY = 700;