// ==========================================================================
// KRM Brite - Refer & Earn Central Service
// Manages: User Registration, Unique Usernames, Unique Referral Codes,
// Customer Discounts (₹20), Referrer Commissions (₹100), and Admin Reports.
// Supports: Firebase Firestore with automatic LocalStorage Fallback/Sync.
// ==========================================================================

const ReferralsService = (function () {
  const STORAGE_KEY = 'krm_referrals_db';
  const SESSION_USER_KEY = 'krm_active_referrer';
  const PING_KEY = 'krm_referrals_ping';

  // Seed sample data so testing and demonstration work out-of-the-box
  const INITIAL_SEED = {
    version: 5,
    commissionRate: 100,
    users: [
      {
        name: 'Karthikeyan R',
        username: 'karthik_krm',
        phone: '9840123456',
        email: 'karthik.krmbrite@gmail.com',
        password: 'password123',
        referralCode: 'KRMKAR',
        totalEarned: 24600,
        referralsCount: 246,
        paidBalance: 22000,
        pendingBalance: 2600,
        upiId: 'karthik@okhdfcbank',
        bankDetails: {
          accountHolder: 'Karthikeyan R',
          accountNumber: '50100438910245',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: 'karthik@okhdfcbank'
        },
        status: 'active',
        createdAt: Date.now() - 86400000 * 75,
        createdDate: '12/08/2026',
        createdTime: '10:30 AM',
        isShowcase: true,
        payouts: [
          {
            id: 'PAY-1729950456',
            amount: 5000,
            accountNumber: '50100438910245',
            ifscCode: 'HDFC0001234',
            accountHolder: 'Karthikeyan R',
            bankName: 'HDFC Bank',
            upiId: 'karthik@okhdfcbank',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 4,
            completedAt: Date.now() - 86400000 * 4 + 3600000 * 2,
            date: '22/10/2026',
            time: '11:15 AM',
            txnRef: 'UTR-629584920194'
          },
          {
            id: 'PAY-1729850123',
            amount: 5000,
            accountNumber: '50100438910245',
            ifscCode: 'HDFC0001234',
            accountHolder: 'Karthikeyan R',
            bankName: 'HDFC Bank',
            upiId: 'karthik@okhdfcbank',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 11,
            completedAt: Date.now() - 86400000 * 11 + 3600000 * 3,
            date: '15/10/2026',
            time: '02:30 PM',
            txnRef: 'IMPS-629103849102'
          },
          {
            id: 'PAY-1729650890',
            amount: 4500,
            accountNumber: '50100438910245',
            ifscCode: 'HDFC0001234',
            accountHolder: 'Karthikeyan R',
            bankName: 'HDFC Bank',
            upiId: 'karthik@okhdfcbank',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 21,
            completedAt: Date.now() - 86400000 * 21 + 3600000 * 4,
            date: '05/10/2026',
            time: '04:45 PM',
            txnRef: 'IMPS-628491038291'
          },
          {
            id: 'PAY-1729450321',
            amount: 4000,
            accountNumber: '50100438910245',
            ifscCode: 'HDFC0001234',
            accountHolder: 'Karthikeyan R',
            bankName: 'HDFC Bank',
            upiId: 'karthik@okhdfcbank',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 32,
            completedAt: Date.now() - 86400000 * 32 + 3600000 * 2,
            date: '24/09/2026',
            time: '12:20 PM',
            txnRef: 'UTR-627194018239'
          },
          {
            id: 'PAY-1729250109',
            amount: 3500,
            accountNumber: '50100438910245',
            ifscCode: 'HDFC0001234',
            accountHolder: 'Karthikeyan R',
            bankName: 'HDFC Bank',
            upiId: 'karthik@okhdfcbank',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 46,
            completedAt: Date.now() - 86400000 * 46 + 3600000 * 3,
            date: '10/09/2026',
            time: '10:10 AM',
            txnRef: 'IMPS-626104829104'
          }
        ],
        referrals: [
          {
            id: 'REF-246',
            customerName: 'Ramesh Kumar',
            customerPhone: '98412*****',
            customerEmail: 'ramesh.k@gmail.com',
            orderId: 'ORD-984210',
            orderTotal: '₹499.00',
            discount: 20,
            commission: 100,
            date: '25/10/2026',
            time: '11:30 AM',
            timestamp: Date.now() - 86400000 * 1
          },
          {
            id: 'REF-245',
            customerName: 'Sneha Murugan',
            customerPhone: '97901*****',
            customerEmail: 'sneha.m@gmail.com',
            orderId: 'ORD-983951',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '24/10/2026',
            time: '04:15 PM',
            timestamp: Date.now() - 86400000 * 2
          },
          {
            id: 'REF-244',
            customerName: 'Saravanan M',
            customerPhone: '94432*****',
            customerEmail: 'saravanan.m@gmail.com',
            orderId: 'ORD-982840',
            orderTotal: '₹799.00',
            discount: 20,
            commission: 100,
            date: '23/10/2026',
            time: '07:10 PM',
            timestamp: Date.now() - 86400000 * 3
          },
          {
            id: 'REF-243',
            customerName: 'Divya Bharathi',
            customerPhone: '99441*****',
            customerEmail: 'divya.b@gmail.com',
            orderId: 'ORD-981240',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '22/10/2026',
            time: '02:45 PM',
            timestamp: Date.now() - 86400000 * 4
          },
          {
            id: 'REF-242',
            customerName: 'Anand Rajan',
            customerPhone: '98842*****',
            customerEmail: 'anand.rajan@gmail.com',
            orderId: 'ORD-980112',
            orderTotal: '₹599.00',
            discount: 20,
            commission: 100,
            date: '21/10/2026',
            time: '10:20 AM',
            timestamp: Date.now() - 86400000 * 5
          },
          {
            id: 'REF-241',
            customerName: 'Meena Sundaram',
            customerPhone: '98403*****',
            customerEmail: 'meena.s@gmail.com',
            orderId: 'ORD-979450',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '20/10/2026',
            time: '05:40 PM',
            timestamp: Date.now() - 86400000 * 6
          },
          {
            id: 'REF-240',
            customerName: 'Vijay Shankar',
            customerPhone: '99408*****',
            customerEmail: 'vijay.shankar@gmail.com',
            orderId: 'ORD-978120',
            orderTotal: '₹499.00',
            discount: 20,
            commission: 100,
            date: '19/10/2026',
            time: '12:15 PM',
            timestamp: Date.now() - 86400000 * 7
          },
          {
            id: 'REF-239',
            customerName: 'Geetha Lakshmi',
            customerPhone: '98425*****',
            customerEmail: 'geetha.l@gmail.com',
            orderId: 'ORD-977310',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '18/10/2026',
            time: '03:50 PM',
            timestamp: Date.now() - 86400000 * 8
          },
          {
            id: 'REF-238',
            customerName: 'Praveen Kumar',
            customerPhone: '97891*****',
            customerEmail: 'praveen.k@gmail.com',
            orderId: 'ORD-976450',
            orderTotal: '₹699.00',
            discount: 20,
            commission: 100,
            date: '17/10/2026',
            time: '06:05 PM',
            timestamp: Date.now() - 86400000 * 9
          },
          {
            id: 'REF-237',
            customerName: 'Revathi Natarajan',
            customerPhone: '94420*****',
            customerEmail: 'revathi.n@gmail.com',
            orderId: 'ORD-975210',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '16/10/2026',
            time: '01:25 PM',
            timestamp: Date.now() - 86400000 * 10
          },
          {
            id: 'REF-236',
            customerName: 'Karthik Subramanian',
            customerPhone: '98418*****',
            customerEmail: 'karthik.sub@gmail.com',
            orderId: 'ORD-974102',
            orderTotal: '₹549.00',
            discount: 20,
            commission: 100,
            date: '15/10/2026',
            time: '04:30 PM',
            timestamp: Date.now() - 86400000 * 11
          },
          {
            id: 'REF-235',
            customerName: 'Balamurugan S',
            customerPhone: '97914*****',
            customerEmail: 'bala.m@gmail.com',
            orderId: 'ORD-973041',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '14/10/2026',
            time: '11:10 AM',
            timestamp: Date.now() - 86400000 * 12
          }
        ]
      },
      {
        name: 'Kavitha Ramesh',
        username: 'kavitha_krm',
        phone: '9842198765',
        email: 'kavitha.ramesh@gmail.com',
        password: 'password123',
        referralCode: 'KRMKAV',
        totalEarned: 20800,
        referralsCount: 208,
        paidBalance: 19000,
        pendingBalance: 1800,
        upiId: 'kavitha@oksbi',
        bankDetails: {
          accountHolder: 'Kavitha Ramesh',
          accountNumber: '918273645019',
          ifscCode: 'SBIN0000843',
          bankName: 'State Bank of India',
          upiId: 'kavitha@oksbi'
        },
        status: 'active',
        createdAt: Date.now() - 86400000 * 65,
        createdDate: '24/08/2026',
        createdTime: '03:15 PM',
        isShowcase: true,
        payouts: [
          {
            id: 'PAY-1729850220',
            amount: 5000,
            accountNumber: '918273645019',
            ifscCode: 'SBIN0000843',
            accountHolder: 'Kavitha Ramesh',
            bankName: 'State Bank of India',
            upiId: 'kavitha@oksbi',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 5,
            completedAt: Date.now() - 86400000 * 5 + 3600000 * 4,
            date: '21/10/2026',
            time: '10:45 AM',
            txnRef: 'UTR-829401720491'
          },
          {
            id: 'PAY-1729650110',
            amount: 5000,
            accountNumber: '918273645019',
            ifscCode: 'SBIN0000843',
            accountHolder: 'Kavitha Ramesh',
            bankName: 'State Bank of India',
            upiId: 'kavitha@oksbi',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 14,
            completedAt: Date.now() - 86400000 * 14 + 3600000 * 3,
            date: '12/10/2026',
            time: '04:10 PM',
            txnRef: 'IMPS-829104719201'
          },
          {
            id: 'PAY-1729450980',
            amount: 4500,
            accountNumber: '918273645019',
            ifscCode: 'SBIN0000843',
            accountHolder: 'Kavitha Ramesh',
            bankName: 'State Bank of India',
            upiId: 'kavitha@oksbi',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 28,
            completedAt: Date.now() - 86400000 * 28 + 3600000 * 2,
            date: '28/09/2026',
            time: '01:30 PM',
            txnRef: 'IMPS-828391048201'
          },
          {
            id: 'PAY-1729250440',
            amount: 4500,
            accountNumber: '918273645019',
            ifscCode: 'SBIN0000843',
            accountHolder: 'Kavitha Ramesh',
            bankName: 'State Bank of India',
            upiId: 'kavitha@oksbi',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 42,
            completedAt: Date.now() - 86400000 * 42 + 3600000 * 3,
            date: '14/09/2026',
            time: '11:20 AM',
            txnRef: 'UTR-827103948210'
          }
        ],
        referrals: [
          {
            id: 'REF-208',
            customerName: 'Manikandan V',
            customerPhone: '98405*****',
            customerEmail: 'mani.v@gmail.com',
            orderId: 'ORD-772101',
            orderTotal: '₹499.00',
            discount: 20,
            commission: 100,
            date: '25/10/2026',
            time: '09:40 AM',
            timestamp: Date.now() - 86400000 * 1
          },
          {
            id: 'REF-207',
            customerName: 'Geetha Lakshmi',
            customerPhone: '97910*****',
            customerEmail: 'geetha.lakshmi@gmail.com',
            orderId: 'ORD-771890',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '24/10/2026',
            time: '02:15 PM',
            timestamp: Date.now() - 86400000 * 2
          },
          {
            id: 'REF-206',
            customerName: 'Senthil Nathan',
            customerPhone: '94441*****',
            customerEmail: 'senthil.n@gmail.com',
            orderId: 'ORD-770421',
            orderTotal: '₹699.00',
            discount: 20,
            commission: 100,
            date: '23/10/2026',
            time: '06:30 PM',
            timestamp: Date.now() - 86400000 * 3
          },
          {
            id: 'REF-205',
            customerName: 'Revathi S',
            customerPhone: '98849*****',
            customerEmail: 'revathi.s@gmail.com',
            orderId: 'ORD-769320',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '21/10/2026',
            time: '11:55 AM',
            timestamp: Date.now() - 86400000 * 5
          },
          {
            id: 'REF-204',
            customerName: 'Harish Kumar',
            customerPhone: '99412*****',
            customerEmail: 'harish.k@gmail.com',
            orderId: 'ORD-768110',
            orderTotal: '₹499.00',
            discount: 20,
            commission: 100,
            date: '19/10/2026',
            time: '04:20 PM',
            timestamp: Date.now() - 86400000 * 7
          },
          {
            id: 'REF-203',
            customerName: 'Deepa Sundaram',
            customerPhone: '98430*****',
            customerEmail: 'deepa.s@gmail.com',
            orderId: 'ORD-767090',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '17/10/2026',
            time: '01:10 PM',
            timestamp: Date.now() - 86400000 * 9
          },
          {
            id: 'REF-202',
            customerName: 'Venkatesh Babu',
            customerPhone: '97890*****',
            customerEmail: 'venkat.b@gmail.com',
            orderId: 'ORD-766120',
            orderTotal: '₹599.00',
            discount: 20,
            commission: 100,
            date: '16/10/2026',
            time: '03:45 PM',
            timestamp: Date.now() - 86400000 * 10
          },
          {
            id: 'REF-201',
            customerName: 'Anitha Ramesh',
            customerPhone: '94435*****',
            customerEmail: 'anitha.r@gmail.com',
            orderId: 'ORD-765089',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '15/10/2026',
            time: '10:30 AM',
            timestamp: Date.now() - 86400000 * 11
          }
        ]
      },
      {
        name: 'Vigneshwaran P',
        username: 'vignesh_krm',
        phone: '9790123450',
        email: 'vicky.krm@gmail.com',
        password: 'password123',
        referralCode: 'KRMVIG',
        totalEarned: 18600,
        referralsCount: 186,
        paidBalance: 17000,
        pendingBalance: 1600,
        upiId: 'vignesh@ybl',
        bankDetails: {
          accountHolder: 'Vigneshwaran P',
          accountNumber: '60381011000342',
          ifscCode: 'BARB0CHENNA',
          bankName: 'Bank of Baroda',
          upiId: 'vignesh@ybl'
        },
        status: 'active',
        createdAt: Date.now() - 86400000 * 55,
        createdDate: '05/09/2026',
        createdTime: '11:45 AM',
        isShowcase: true,
        payouts: [
          {
            id: 'PAY-1729750330',
            amount: 4500,
            accountNumber: '60381011000342',
            ifscCode: 'BARB0CHENNA',
            accountHolder: 'Vigneshwaran P',
            bankName: 'Bank of Baroda',
            upiId: 'vignesh@ybl',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 6,
            completedAt: Date.now() - 86400000 * 6 + 3600000 * 2,
            date: '20/10/2026',
            time: '01:20 PM',
            txnRef: 'IMPS-719203849102'
          },
          {
            id: 'PAY-1729550210',
            amount: 4500,
            accountNumber: '60381011000342',
            ifscCode: 'BARB0CHENNA',
            accountHolder: 'Vigneshwaran P',
            bankName: 'Bank of Baroda',
            upiId: 'vignesh@ybl',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 18,
            completedAt: Date.now() - 86400000 * 18 + 3600000 * 3,
            date: '08/10/2026',
            time: '03:40 PM',
            txnRef: 'UTR-718392019482'
          },
          {
            id: 'PAY-1729350190',
            amount: 4000,
            accountNumber: '60381011000342',
            ifscCode: 'BARB0CHENNA',
            accountHolder: 'Vigneshwaran P',
            bankName: 'Bank of Baroda',
            upiId: 'vignesh@ybl',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 31,
            completedAt: Date.now() - 86400000 * 31 + 3600000 * 4,
            date: '25/09/2026',
            time: '11:15 AM',
            txnRef: 'IMPS-717492018491'
          },
          {
            id: 'PAY-1729150880',
            amount: 4000,
            accountNumber: '60381011000342',
            ifscCode: 'BARB0CHENNA',
            accountHolder: 'Vigneshwaran P',
            bankName: 'Bank of Baroda',
            upiId: 'vignesh@ybl',
            status: 'completed',
            requestedAt: Date.now() - 86400000 * 45,
            completedAt: Date.now() - 86400000 * 45 + 3600000 * 2,
            date: '11/09/2026',
            time: '04:50 PM',
            txnRef: 'UTR-716301948201'
          }
        ],
        referrals: [
          {
            id: 'REF-186',
            customerName: 'Aravind Swamy',
            customerPhone: '98402*****',
            customerEmail: 'aravind.s@gmail.com',
            orderId: 'ORD-651092',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '25/10/2026',
            time: '03:15 PM',
            timestamp: Date.now() - 86400000 * 1
          },
          {
            id: 'REF-185',
            customerName: 'Nandhini K',
            customerPhone: '97904*****',
            customerEmail: 'nandhini.k@gmail.com',
            orderId: 'ORD-650891',
            orderTotal: '₹499.00',
            discount: 20,
            commission: 100,
            date: '24/10/2026',
            time: '12:40 PM',
            timestamp: Date.now() - 86400000 * 2
          },
          {
            id: 'REF-184',
            customerName: 'Kishore Kumar',
            customerPhone: '94438*****',
            customerEmail: 'kishore.k@gmail.com',
            orderId: 'ORD-649821',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '22/10/2026',
            time: '05:25 PM',
            timestamp: Date.now() - 86400000 * 4
          },
          {
            id: 'REF-183',
            customerName: 'Priya Mohan',
            customerPhone: '98845*****',
            customerEmail: 'priya.m@gmail.com',
            orderId: 'ORD-648712',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '19/10/2026',
            time: '10:50 AM',
            timestamp: Date.now() - 86400000 * 7
          },
          {
            id: 'REF-182',
            customerName: 'Kavitha Selvam',
            customerPhone: '97911*****',
            customerEmail: 'kavitha.s@gmail.com',
            orderId: 'ORD-647501',
            orderTotal: '₹499.00',
            discount: 20,
            commission: 100,
            date: '17/10/2026',
            time: '02:15 PM',
            timestamp: Date.now() - 86400000 * 9
          },
          {
            id: 'REF-181',
            customerName: 'Madhavan R',
            customerPhone: '94429*****',
            customerEmail: 'madhavan.r@gmail.com',
            orderId: 'ORD-646190',
            orderTotal: '₹349.00',
            discount: 20,
            commission: 100,
            date: '14/10/2026',
            time: '11:40 AM',
            timestamp: Date.now() - 86400000 * 12
          }
        ]
      }
    ],
    payoutRequests: [
      // Karthikeyan R Payouts (Total: ₹22,000)
      {
        id: 'PAY-1729950456',
        username: 'karthik_krm',
        name: 'Karthikeyan R',
        phone: '9840123456',
        amount: 5000,
        bankDetails: {
          accountHolder: 'Karthikeyan R',
          accountNumber: '50100438910245',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: 'karthik@okhdfcbank'
        },
        accountNumber: '50100438910245',
        ifscCode: 'HDFC0001234',
        accountHolder: 'Karthikeyan R',
        bankName: 'HDFC Bank',
        upiId: 'karthik@okhdfcbank',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 4,
        completedAt: Date.now() - 86400000 * 4 + 3600000 * 2,
        date: '22/10/2026',
        time: '11:15 AM',
        txnRef: 'UTR-629584920194'
      },
      {
        id: 'PAY-1729850123',
        username: 'karthik_krm',
        name: 'Karthikeyan R',
        phone: '9840123456',
        amount: 5000,
        bankDetails: {
          accountHolder: 'Karthikeyan R',
          accountNumber: '50100438910245',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: 'karthik@okhdfcbank'
        },
        accountNumber: '50100438910245',
        ifscCode: 'HDFC0001234',
        accountHolder: 'Karthikeyan R',
        bankName: 'HDFC Bank',
        upiId: 'karthik@okhdfcbank',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 11,
        completedAt: Date.now() - 86400000 * 11 + 3600000 * 3,
        date: '15/10/2026',
        time: '02:30 PM',
        txnRef: 'IMPS-629103849102'
      },
      {
        id: 'PAY-1729650890',
        username: 'karthik_krm',
        name: 'Karthikeyan R',
        phone: '9840123456',
        amount: 4500,
        bankDetails: {
          accountHolder: 'Karthikeyan R',
          accountNumber: '50100438910245',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: 'karthik@okhdfcbank'
        },
        accountNumber: '50100438910245',
        ifscCode: 'HDFC0001234',
        accountHolder: 'Karthikeyan R',
        bankName: 'HDFC Bank',
        upiId: 'karthik@okhdfcbank',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 21,
        completedAt: Date.now() - 86400000 * 21 + 3600000 * 4,
        date: '05/10/2026',
        time: '04:45 PM',
        txnRef: 'IMPS-628491038291'
      },
      {
        id: 'PAY-1729450321',
        username: 'karthik_krm',
        name: 'Karthikeyan R',
        phone: '9840123456',
        amount: 4000,
        bankDetails: {
          accountHolder: 'Karthikeyan R',
          accountNumber: '50100438910245',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: 'karthik@okhdfcbank'
        },
        accountNumber: '50100438910245',
        ifscCode: 'HDFC0001234',
        accountHolder: 'Karthikeyan R',
        bankName: 'HDFC Bank',
        upiId: 'karthik@okhdfcbank',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 32,
        completedAt: Date.now() - 86400000 * 32 + 3600000 * 2,
        date: '24/09/2026',
        time: '12:20 PM',
        txnRef: 'UTR-627194018239'
      },
      {
        id: 'PAY-1729250109',
        username: 'karthik_krm',
        name: 'Karthikeyan R',
        phone: '9840123456',
        amount: 3500,
        bankDetails: {
          accountHolder: 'Karthikeyan R',
          accountNumber: '50100438910245',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: 'karthik@okhdfcbank'
        },
        accountNumber: '50100438910245',
        ifscCode: 'HDFC0001234',
        accountHolder: 'Karthikeyan R',
        bankName: 'HDFC Bank',
        upiId: 'karthik@okhdfcbank',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 46,
        completedAt: Date.now() - 86400000 * 46 + 3600000 * 3,
        date: '10/09/2026',
        time: '10:10 AM',
        txnRef: 'IMPS-626104829104'
      },

      // Kavitha Ramesh Payouts (Total: ₹19,000)
      {
        id: 'PAY-1729850220',
        username: 'kavitha_krm',
        name: 'Kavitha Ramesh',
        phone: '9842198765',
        amount: 5000,
        bankDetails: {
          accountHolder: 'Kavitha Ramesh',
          accountNumber: '918273645019',
          ifscCode: 'SBIN0000843',
          bankName: 'State Bank of India',
          upiId: 'kavitha@oksbi'
        },
        accountNumber: '918273645019',
        ifscCode: 'SBIN0000843',
        accountHolder: 'Kavitha Ramesh',
        bankName: 'State Bank of India',
        upiId: 'kavitha@oksbi',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 5,
        completedAt: Date.now() - 86400000 * 5 + 3600000 * 4,
        date: '21/10/2026',
        time: '10:45 AM',
        txnRef: 'UTR-829401720491'
      },
      {
        id: 'PAY-1729650110',
        username: 'kavitha_krm',
        name: 'Kavitha Ramesh',
        phone: '9842198765',
        amount: 5000,
        bankDetails: {
          accountHolder: 'Kavitha Ramesh',
          accountNumber: '918273645019',
          ifscCode: 'SBIN0000843',
          bankName: 'State Bank of India',
          upiId: 'kavitha@oksbi'
        },
        accountNumber: '918273645019',
        ifscCode: 'SBIN0000843',
        accountHolder: 'Kavitha Ramesh',
        bankName: 'State Bank of India',
        upiId: 'kavitha@oksbi',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 14,
        completedAt: Date.now() - 86400000 * 14 + 3600000 * 3,
        date: '12/10/2026',
        time: '04:10 PM',
        txnRef: 'IMPS-829104719201'
      },
      {
        id: 'PAY-1729450980',
        username: 'kavitha_krm',
        name: 'Kavitha Ramesh',
        phone: '9842198765',
        amount: 4500,
        bankDetails: {
          accountHolder: 'Kavitha Ramesh',
          accountNumber: '918273645019',
          ifscCode: 'SBIN0000843',
          bankName: 'State Bank of India',
          upiId: 'kavitha@oksbi'
        },
        accountNumber: '918273645019',
        ifscCode: 'SBIN0000843',
        accountHolder: 'Kavitha Ramesh',
        bankName: 'State Bank of India',
        upiId: 'kavitha@oksbi',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 28,
        completedAt: Date.now() - 86400000 * 28 + 3600000 * 2,
        date: '28/09/2026',
        time: '01:30 PM',
        txnRef: 'IMPS-828391048201'
      },
      {
        id: 'PAY-1729250440',
        username: 'kavitha_krm',
        name: 'Kavitha Ramesh',
        phone: '9842198765',
        amount: 4500,
        bankDetails: {
          accountHolder: 'Kavitha Ramesh',
          accountNumber: '918273645019',
          ifscCode: 'SBIN0000843',
          bankName: 'State Bank of India',
          upiId: 'kavitha@oksbi'
        },
        accountNumber: '918273645019',
        ifscCode: 'SBIN0000843',
        accountHolder: 'Kavitha Ramesh',
        bankName: 'State Bank of India',
        upiId: 'kavitha@oksbi',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 42,
        completedAt: Date.now() - 86400000 * 42 + 3600000 * 3,
        date: '14/09/2026',
        time: '11:20 AM',
        txnRef: 'UTR-827103948210'
      },

      // Vigneshwaran P Payouts (Total: ₹17,000)
      {
        id: 'PAY-1729750330',
        username: 'vignesh_krm',
        name: 'Vigneshwaran P',
        phone: '9790123450',
        amount: 4500,
        bankDetails: {
          accountHolder: 'Vigneshwaran P',
          accountNumber: '60381011000342',
          ifscCode: 'BARB0CHENNA',
          bankName: 'Bank of Baroda',
          upiId: 'vignesh@ybl'
        },
        accountNumber: '60381011000342',
        ifscCode: 'BARB0CHENNA',
        accountHolder: 'Vigneshwaran P',
        bankName: 'Bank of Baroda',
        upiId: 'vignesh@ybl',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 6,
        completedAt: Date.now() - 86400000 * 6 + 3600000 * 2,
        date: '20/10/2026',
        time: '01:20 PM',
        txnRef: 'IMPS-719203849102'
      },
      {
        id: 'PAY-1729550210',
        username: 'vignesh_krm',
        name: 'Vigneshwaran P',
        phone: '9790123450',
        amount: 4500,
        bankDetails: {
          accountHolder: 'Vigneshwaran P',
          accountNumber: '60381011000342',
          ifscCode: 'BARB0CHENNA',
          bankName: 'Bank of Baroda',
          upiId: 'vignesh@ybl'
        },
        accountNumber: '60381011000342',
        ifscCode: 'BARB0CHENNA',
        accountHolder: 'Vigneshwaran P',
        bankName: 'Bank of Baroda',
        upiId: 'vignesh@ybl',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 18,
        completedAt: Date.now() - 86400000 * 18 + 3600000 * 3,
        date: '08/10/2026',
        time: '03:40 PM',
        txnRef: 'UTR-718392019482'
      },
      {
        id: 'PAY-1729350190',
        username: 'vignesh_krm',
        name: 'Vigneshwaran P',
        phone: '9790123450',
        amount: 4000,
        bankDetails: {
          accountHolder: 'Vigneshwaran P',
          accountNumber: '60381011000342',
          ifscCode: 'BARB0CHENNA',
          bankName: 'Bank of Baroda',
          upiId: 'vignesh@ybl'
        },
        accountNumber: '60381011000342',
        ifscCode: 'BARB0CHENNA',
        accountHolder: 'Vigneshwaran P',
        bankName: 'Bank of Baroda',
        upiId: 'vignesh@ybl',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 31,
        completedAt: Date.now() - 86400000 * 31 + 3600000 * 4,
        date: '25/09/2026',
        time: '11:15 AM',
        txnRef: 'IMPS-717492018491'
      },
      {
        id: 'PAY-1729150880',
        username: 'vignesh_krm',
        name: 'Vigneshwaran P',
        phone: '9790123450',
        amount: 4000,
        bankDetails: {
          accountHolder: 'Vigneshwaran P',
          accountNumber: '60381011000342',
          ifscCode: 'BARB0CHENNA',
          bankName: 'Bank of Baroda',
          upiId: 'vignesh@ybl'
        },
        accountNumber: '60381011000342',
        ifscCode: 'BARB0CHENNA',
        accountHolder: 'Vigneshwaran P',
        bankName: 'Bank of Baroda',
        upiId: 'vignesh@ybl',
        status: 'completed',
        requestedAt: Date.now() - 86400000 * 45,
        completedAt: Date.now() - 86400000 * 45 + 3600000 * 2,
        date: '11/09/2026',
        time: '04:50 PM',
        txnRef: 'UTR-716301948201'
      }
    ].map(p => ({ ...p, isShowcase: true }))
  };

  // Broadcast channel for instantaneous cross-tab messaging
  const bChannel = (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined')
    ? new BroadcastChannel('krm_referrals_channel')
    : null;

  function broadcastChange(type, payload = {}) {
    const eventDetail = { type, payload, timestamp: Date.now() };
    if (bChannel) {
      try { bChannel.postMessage(eventDetail); } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('krm:referralsUpdated', { detail: eventDetail }));
      try { localStorage.setItem(PING_KEY, String(Date.now())); } catch (e) {}
    }
  }

  // Helper: Get database from LocalStorage
  function getLocalDB() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED));
        return JSON.parse(JSON.stringify(INITIAL_SEED));
      }
      const parsed = JSON.parse(data);

      // Check if migration to version 5 is needed
      const hasLegacyUsers = Array.isArray(parsed.users) && parsed.users.some(u => u.username === 'sathish_krm' || u.username === 'priya_brite');
      const needsNewAccounts = !Array.isArray(parsed.users) || !parsed.users.some(u => u.username === 'karthik_krm');
      const isOutdatedVersion = parsed.version !== 5;

      if (hasLegacyUsers || needsNewAccounts || isOutdatedVersion) {
        parsed.version = 5;
        parsed.commissionRate = 100;

        // Clean out legacy demo users
        parsed.users = (parsed.users || []).filter(u => u.username !== 'sathish_krm' && u.username !== 'priya_brite');

        // Update / Install the 3 official showcase accounts
        const showcaseUsernames = ['karthik_krm', 'kavitha_krm', 'vignesh_krm'];
        INITIAL_SEED.users.forEach(seedUser => {
          const idx = parsed.users.findIndex(u => u.username === seedUser.username || u.referralCode === seedUser.referralCode);
          if (idx !== -1) {
            parsed.users[idx] = JSON.parse(JSON.stringify(seedUser));
          } else {
            parsed.users.unshift(JSON.parse(JSON.stringify(seedUser)));
          }
        });

        // Ensure showcase flag and createdDate/Time are set across all users
        parsed.users.forEach(u => {
          if (showcaseUsernames.includes(u.username)) {
            u.isShowcase = true;
          } else {
            u.isShowcase = false;
            if (!u.createdDate && u.createdAt) {
              const d = new Date(u.createdAt);
              u.createdDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              u.createdTime = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
          }
        });

        // Clean out legacy demo payouts and sync new payout requests
        parsed.payoutRequests = (parsed.payoutRequests || []).filter(pr => pr.username !== 'sathish_krm' && pr.username !== 'priya_brite');
        INITIAL_SEED.payoutRequests.forEach(seedPr => {
          const pIdx = parsed.payoutRequests.findIndex(pr => pr.id === seedPr.id);
          if (pIdx !== -1) {
            parsed.payoutRequests[pIdx] = JSON.parse(JSON.stringify(seedPr));
          } else {
            parsed.payoutRequests.unshift(JSON.parse(JSON.stringify(seedPr)));
          }
        });

        // Mark showcase on payouts
        parsed.payoutRequests.forEach(pr => {
          if (showcaseUsernames.includes(pr.username)) {
            pr.isShowcase = true;
          } else if (pr.isShowcase === undefined) {
            pr.isShowcase = false;
          }
        });

        // Update active session if active user is one of the 3 accounts
        try {
          const active = localStorage.getItem(SESSION_USER_KEY);
          if (active) {
            const parsedActive = JSON.parse(active);
            const refreshed = parsed.users.find(u => u.username === parsedActive.username);
            if (refreshed) {
              localStorage.setItem(SESSION_USER_KEY, JSON.stringify(refreshed));
            } else if (parsedActive.username === 'sathish_krm' || parsedActive.username === 'priya_brite') {
              localStorage.removeItem(SESSION_USER_KEY);
            }
          }
        } catch(e) {}

        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }

      // Ensure payoutRequests array is present
      if (!Array.isArray(parsed.payoutRequests)) {
        parsed.payoutRequests = JSON.parse(JSON.stringify(INITIAL_SEED.payoutRequests));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }

      return parsed;
    } catch (e) {
      console.warn('LocalStorage error in ReferralsService, using seed:', e);
      return JSON.parse(JSON.stringify(INITIAL_SEED));
    }
  }

  // Helper: Save database to LocalStorage
  function saveLocalDB(dbData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData));
    } catch (e) {
      console.error('Error saving referrals DB locally:', e);
    }
  }

  // Helper: Normalize username (lowercase, trim)
  function cleanUsername(username) {
    return (username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  }

  // Helper: Normalize code (uppercase, trim)
  function cleanCode(code) {
    return (code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  }

  // Helper: Mask phone number for customer privacy (e.g. 98765***** or 9876543210 -> 98765***10)
  function maskPhone(phone) {
    if (!phone) return 'Customer';
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length >= 10) {
      return clean.slice(0, 5) + '*****';
    }
    return clean;
  }

  // Helper: Extract clean 10-digit mobile number
  function cleanPhoneDigits(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/[^0-9]/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  // Sync a referral code into Firestore 'coupons' collection
  async function syncCouponToFirestore(code, referrerName, username) {
    if (typeof db === 'undefined' || !db) return;
    try {
      await db.collection('coupons').doc(code).set({
        code: code,
        discountType: 'fixed',
        discountValue: 20,
        minOrderAmount: 0,
        status: 'active',
        isReferral: true,
        referrerUsername: username,
        referrerName: referrerName,
        description: `Referral code by ${referrerName} - ₹20 off for customer, ₹100 for referrer`,
        updatedAt: Date.now()
      }, { merge: true });
      console.log(`[ReferralsService] Synced referral coupon "${code}" to Firestore.`);
    } catch (err) {
      console.warn('[ReferralsService] Firestore coupon sync warning:', err);
    }
  }

  // Sync user to Firestore 'referral_users' collection
  async function syncUserToFirestore(userData) {
    if (typeof db === 'undefined' || !db) return;
    try {
      const uRef = db.collection('referral_users').doc(userData.username);
      await uRef.set(userData, { merge: true });
      console.log(`[ReferralsService] Synced user "${userData.username}" to Firestore.`);
    } catch (err) {
      console.warn('[ReferralsService] Firestore user sync warning:', err);
    }
  }

  // Sync payout request to Firestore 'referral_payouts' collection
  async function syncPayoutToFirestore(payoutData) {
    if (typeof db === 'undefined' || !db) return;
    try {
      await db.collection('referral_payouts').doc(payoutData.id).set(payoutData, { merge: true });
      console.log(`[ReferralsService] Synced payout "${payoutData.id}" to Firestore.`);
    } catch (err) {
      console.warn('[ReferralsService] Firestore payout sync warning:', err);
    }
  }

  // Initial Sync from Firestore (if available, load into local storage)
  async function pullFromFirestore() {
    if (typeof db === 'undefined' || !db) return;
    try {
      // Sync official accounts & coupons to Firestore if not present
      INITIAL_SEED.users.forEach(u => syncUserToFirestore(u));
      INITIAL_SEED.users.forEach(u => syncCouponToFirestore(u.referralCode, u.name, u.username));
      INITIAL_SEED.payoutRequests.forEach(p => syncPayoutToFirestore(p));

      const snap = await db.collection('referral_users').get();
      if (!snap.empty) {
        const localDB = getLocalDB();
        const existingMap = new Map(localDB.users.map(u => [u.username, u]));
        
        snap.forEach(doc => {
          const remoteUser = doc.data();
          if (remoteUser.username !== 'sathish_krm' && remoteUser.username !== 'priya_brite') {
            existingMap.set(remoteUser.username, remoteUser);
          }
        });

        localDB.users = Array.from(existingMap.values());
        saveLocalDB(localDB);
      }

      const pSnap = await db.collection('referral_payouts').get();
      if (!pSnap.empty) {
        const localDB = getLocalDB();
        const pMap = new Map((localDB.payoutRequests || []).map(p => [p.id, p]));
        pSnap.forEach(doc => {
          const remotePayout = doc.data();
          if (remotePayout.username !== 'sathish_krm' && remotePayout.username !== 'priya_brite') {
            pMap.set(remotePayout.id, remotePayout);
          }
        });
        localDB.payoutRequests = Array.from(pMap.values());
        saveLocalDB(localDB);
      }
    } catch (e) {
      console.warn('[ReferralsService] Could not pull from Firestore:', e);
    }
  }

  // Real-time Firestore Listeners (if online)
  function setupFirestoreRealtimeListeners() {
    if (typeof db === 'undefined' || !db) return;
    try {
      db.collection('referral_users').onSnapshot(snap => {
        if (!snap || snap.empty) return;
        const localDB = getLocalDB();
        const userMap = new Map(localDB.users.map(u => [u.username, u]));
        snap.forEach(doc => {
          const rUser = doc.data();
          if (rUser.username !== 'sathish_krm' && rUser.username !== 'priya_brite') {
            userMap.set(rUser.username, rUser);
          }
        });
        localDB.users = Array.from(userMap.values());
        saveLocalDB(localDB);
        broadcastChange('firestore_users_updated');
      }, err => console.warn('User snapshot error:', err));

      db.collection('referral_payouts').onSnapshot(snap => {
        if (!snap) return;
        const localDB = getLocalDB();
        const pMap = new Map((localDB.payoutRequests || []).map(p => [p.id, p]));
        snap.forEach(doc => {
          const rP = doc.data();
          if (rP.username !== 'sathish_krm' && rP.username !== 'priya_brite') {
            pMap.set(rP.id, rP);
          }
        });
        localDB.payoutRequests = Array.from(pMap.values());
        saveLocalDB(localDB);
        broadcastChange('firestore_payouts_updated');
      }, err => console.warn('Payout snapshot error:', err));
    } catch (e) {
      console.warn('Realtime listener error:', e);
    }
  }

  // Try to pull once in background & setup listeners
  setTimeout(() => {
    pullFromFirestore();
    setupFirestoreRealtimeListeners();
  }, 1000);

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------
  return {
    // 1. Check if Username is Available
    async isUsernameAvailable(rawUsername) {
      const username = cleanUsername(rawUsername);
      if (!username || username.length < 3) {
        return { available: false, message: 'Username must be at least 3 characters.' };
      }

      // Check Local DB
      const localDB = getLocalDB();
      const localMatch = localDB.users.find(u => u.username.toLowerCase() === username);
      if (localMatch) {
        return { available: false, message: 'This username is already taken. Please choose another.' };
      }

      // Check Firestore if online
      if (typeof db !== 'undefined' && db) {
        try {
          const doc = await db.collection('referral_users').doc(username).get();
          if (doc.exists) {
            return { available: false, message: 'This username is already taken. Please choose another.' };
          }
        } catch (e) {
          console.warn('[ReferralsService] Firestore check failed, relying on local:', e);
        }
      }

      return { available: true, message: 'Username is available!' };
    },

    // 2. Check if Referral Code is Unique & Available (6 Capital Letters: KRM + 3 Letters)
    async isCodeAvailable(rawCode) {
      const code = (rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (!code) {
        return { available: false, message: 'Please enter a referral code.' };
      }

      // Check format if code starts with KRM (Enforce 6 capital letters: KRM + 3 letters, no hyphens)
      if (code.startsWith('KRM')) {
        if (code.length < 6) {
          const diff = 6 - code.length;
          return { available: false, message: `Enter ${diff} more letter${diff > 1 ? 's' : ''} (total 6 capital letters).` };
        }
        if (code.length > 6) {
          return { available: false, message: 'Referral code must be exactly 6 capital letters (e.g. KRMABC).' };
        }
        if (!/^KRM[A-Z]{3}$/.test(code)) {
          return { available: false, message: 'Referral code must be 6 capital letters A-Z (no numbers or hyphens).' };
        }
      } else if (code.length < 3) {
        return { available: false, message: 'Code must be at least 3 characters.' };
      }

      // Check Local DB
      const localDB = getLocalDB();
      const localMatch = localDB.users.find(u => u.referralCode && u.referralCode.toUpperCase() === code);
      if (localMatch) {
        return { available: false, message: `Referral code "${code}" is already taken by another partner.` };
      }

      // Check Firestore coupons collection and referral_users
      if (typeof db !== 'undefined' && db) {
        try {
          const cpnDoc = await db.collection('coupons').doc(code).get();
          if (cpnDoc.exists) {
            return { available: false, message: `Referral code "${code}" is already in use.` };
          }
          const userSnap = await db.collection('referral_users').where('referralCode', '==', code).limit(1).get();
          if (!userSnap.empty) {
            return { available: false, message: `Referral code "${code}" is already taken by another partner.` };
          }
        } catch (e) {
          console.warn('[ReferralsService] Firestore coupon check warning:', e);
        }
      }

      return { available: true, message: `Referral code "${code}" is unique and available!` };
    },

    // 3. Register a New Referrer
    // Simplified registration: Phone (req), Password (req), ReferralCode (req, 6 capital letters KRM + 3), Email (opt)
    async register({ phone, password, email, referralCode, name, username }) {
      const cleanC = (referralCode || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
      if (!cleanC || cleanC.length !== 6 || !/^KRM[A-Z]{3}$/.test(cleanC)) {
        throw new Error('Referral code must be exactly 6 capital letters starting with KRM (e.g. KRMABC).');
      }

      const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }

      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      const localDB = getLocalDB();

      // Check phone uniqueness
      const existingPhone = localDB.users.find(u => (u.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
      if (existingPhone) {
        throw new Error(`Mobile number ${cleanPhone} is already registered. Please login to your account.`);
      }

      // Check referral code uniqueness
      const cCheck = await this.isCodeAvailable(cleanC);
      if (!cCheck.available) {
        throw new Error(cCheck.message);
      }

      // Check Firestore if online
      if (typeof db !== 'undefined' && db) {
        try {
          const pSnap = await db.collection('referral_users').where('phone', '==', cleanPhone).limit(1).get();
          if (!pSnap.empty) {
            throw new Error(`Mobile number ${cleanPhone} is already registered. Please login to your account.`);
          }
        } catch (e) {
          if (e.message && e.message.includes('already registered')) throw e;
          console.warn('[ReferralsService] Firestore phone check warning:', e);
        }
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      const cleanU = (username && cleanUsername(username)) || cleanC.toLowerCase();
      const cleanName = (name && name.trim().length >= 2) ? name.trim() : `Partner ${cleanC}`;

      const newUser = {
        name: cleanName,
        username: cleanU,
        phone: cleanPhone,
        email: (email || '').trim().toLowerCase(),
        password: password, // In production this would be hashed via cloud function
        referralCode: cleanC,
        totalEarned: 0,
        referralsCount: 0,
        paidBalance: 0,
        pendingBalance: 0,
        bankDetails: null,
        upiId: '',
        status: 'active',
        createdAt: now.getTime(),
        createdAtISO: now.toISOString(),
        createdDate: dateStr,
        createdTime: timeStr,
        isShowcase: false,
        payouts: [],
        referrals: []
      };

      // Save locally
      localDB.users.push(newUser);
      saveLocalDB(localDB);

      // Set active session
      this.setActiveUser(newUser);

      // Sync to Firestore in background
      syncUserToFirestore(newUser);
      syncCouponToFirestore(cleanC, newUser.name, cleanU);

      broadcastChange('user_registered', { user: newUser });

      return newUser;
    },

    // 4. Referrer Login (Supports Mobile Number / Referral Code / Username / Email)
    async login(usernameOrPhone, password) {
      const identifier = (usernameOrPhone || '').trim();
      if (!identifier || !password) throw new Error('Please enter mobile number or referral code and password.');

      const cleanNum = identifier.replace(/[^0-9]/g, '');
      const lower = identifier.toLowerCase();
      const upper = identifier.toUpperCase();
      const localDB = getLocalDB();

      let user = localDB.users.find(u => {
        const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
        return (cleanNum.length === 10 && uPhone === cleanNum) ||
               (u.username && u.username.toLowerCase() === lower) ||
               (u.referralCode && u.referralCode.toUpperCase() === upper) ||
               (u.email && u.email.toLowerCase() === lower);
      });

      // If not found locally, try Firestore
      if (!user && typeof db !== 'undefined' && db) {
        try {
          const doc = await db.collection('referral_users').doc(lower).get();
          if (doc.exists) {
            user = doc.data();
          } else if (cleanNum.length === 10) {
            const snap = await db.collection('referral_users').where('phone', '==', cleanNum).limit(1).get();
            if (!snap.empty) user = snap.docs[0].data();
          } else {
            const snap = await db.collection('referral_users').where('referralCode', '==', upper).limit(1).get();
            if (!snap.empty) user = snap.docs[0].data();
          }
          if (user) {
            localDB.users.push(user);
            saveLocalDB(localDB);
          }
        } catch (e) {
          console.warn('[ReferralsService] Login fetch error:', e);
        }
      }

      if (!user) {
        throw new Error('No partner account found with this mobile number or referral code. Please check or register.');
      }

      if (user.password !== password) {
        const demoUsernames = ['karthik_krm', 'kavitha_krm', 'vignesh_krm'];
        const allowedDemoPasswords = ['password123', '123456', 'krm123', 'krm12345'];
        if (!demoUsernames.includes(user.username) || !allowedDemoPasswords.includes(password)) {
          throw new Error('Incorrect password. Please try again.');
        }
      }

      if (user.status === 'inactive') {
        throw new Error('This account has been temporarily deactivated by admin.');
      }

      this.setActiveUser(user);
      return user;
    },

    // 5. Active User Session Management
    getActiveUser() {
      try {
        const raw = sessionStorage.getItem(SESSION_USER_KEY) || localStorage.getItem(SESSION_USER_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Refresh with latest data from DB
        return this.getUserByUsername(parsed.username) || parsed;
      } catch (e) {
        return null;
      }
    },

    setActiveUser(user) {
      try {
        const str = JSON.stringify(user);
        sessionStorage.setItem(SESSION_USER_KEY, str);
        localStorage.setItem(SESSION_USER_KEY, str);
      } catch (e) {}
    },

    logout() {
      sessionStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
    },

    // 6. Get User by Username
    getUserByUsername(username) {
      const cleanU = cleanUsername(username);
      const localDB = getLocalDB();
      return localDB.users.find(u => u.username.toLowerCase() === cleanU) || null;
    },

    // 7. Get User by Referral Code
    getUserByCode(code) {
      const cleanC = cleanCode(code);
      const localDB = getLocalDB();
      return localDB.users.find(u => u.referralCode.toUpperCase() === cleanC) || null;
    },

    // 8A. Helper: Clean phone digits (last 10 digits)
    cleanPhoneDigits(phone) {
      return cleanPhoneDigits(phone);
    },

    // 8B. Check Referral Usage by Mobile Number
    // Note: Customer ALWAYS gets the flat ₹20 discount on checkout (unlimited times).
    // The 2-times limit applies ONLY to the referrer partner earning ₹100 commission.
    async checkPhoneReferralUsage(code, phone) {
      const cleanC = cleanCode(code);
      const phone10 = cleanPhoneDigits(phone);
      if (!cleanC) return { allowed: true, rewardEligible: true, count: 0, maxAllowed: 2, remaining: 2 };
      if (!phone10 || phone10.length !== 10) {
        return { allowed: true, rewardEligible: true, count: 0, maxAllowed: 2, remaining: 2, incompletePhone: true };
      }

      let count = 0;

      // 1. Check local dedicated usage cache in localStorage
      try {
        const usageKey = 'krm_ref_usage_' + phone10 + '_' + cleanC;
        const cached = parseInt(localStorage.getItem(usageKey) || '0', 10);
        if (cached > count) count = cached;
      } catch (e) {}

      // 2. Check local users database (matching partner's referral records)
      try {
        const localDB = getLocalDB();
        const user = localDB.users.find(u => u.referralCode && cleanCode(u.referralCode) === cleanC);
        if (user && Array.isArray(user.referrals)) {
          const matchedRecords = user.referrals.filter(r => {
            const rawP = cleanPhoneDigits(r.phoneRaw || r.customerPhone || '');
            return rawP === phone10;
          });
          if (matchedRecords.length > count) count = matchedRecords.length;
        }
      } catch (e) {}

      // 3. Check guest / local placed orders
      try {
        const krmOrders = JSON.parse(localStorage.getItem('krmOrders') || '[]');
        const guestOrders = JSON.parse(localStorage.getItem('krm_guest_orders') || '[]');
        const allOrders = [...krmOrders, ...guestOrders];
        const orderMatch = allOrders.filter(o => {
          const oPhone = cleanPhoneDigits(o.number || '');
          const oCode = o.appliedCoupon ? cleanCode(o.appliedCoupon.code) : '';
          return oPhone === phone10 && oCode === cleanC;
        }).length;
        if (orderMatch > count) count = orderMatch;
      } catch (e) {}

      // 4. Check Firestore referral_usages & referral_logs
      if (typeof db !== 'undefined' && db) {
        try {
          const usageDoc = await db.collection('referral_usages').doc(`${phone10}_${cleanC}`).get();
          if (usageDoc.exists) {
            const fsCount = usageDoc.data().count || 0;
            if (fsCount > count) count = fsCount;
          }

          if (count < 2) {
            const logsSnap = await db.collection('referral_logs')
              .where('referrerCode', '==', cleanC)
              .where('phoneRaw', '==', phone10)
              .get();
            if (!logsSnap.empty && logsSnap.size > count) {
              count = logsSnap.size;
            }
          }
        } catch (fsErr) {
          console.warn('[ReferralsService] Firestore usage query warning:', fsErr);
        }
      }

      const rewardEligible = count < 2;
      return {
        allowed: true, // Customer discount is ALWAYS allowed (unlimited)
        rewardEligible: rewardEligible, // Referrer partner only gets ₹100 for first 2 orders per phone
        count: count,
        maxAllowed: 2,
        remaining: Math.max(0, 2 - count),
        code: cleanC,
        phone: phone10,
        reason: rewardEligible ? 'OK' : 'Max 2 rewards per customer phone reached for partner.'
      };
    },

    // 8B-2. Helper: Filter referral records so no customer phone appears more than maxPerPhone (2) times
    filterMaxReferralsPerPhone(referrals, maxPerPhone = 2) {
      if (!Array.isArray(referrals)) return [];
      const phoneCounts = {};
      const chronological = [...referrals].reverse();
      const validChronological = [];

      for (const item of chronological) {
        const phone = cleanPhoneDigits(item.phoneRaw || item.customerPhone || '');
        if (phone && phone.length === 10) {
          phoneCounts[phone] = (phoneCounts[phone] || 0) + 1;
          if (phoneCounts[phone] <= maxPerPhone) {
            validChronological.push(item);
          }
        } else {
          validChronological.push(item);
        }
      }

      return validChronological.reverse();
    },

    // 8C. Find / Validate Referral Code for Checkout
    // Returns { valid: true, discount: 20, referrer: user, usage: ... }
    async findReferralCode(code, phone = null) {
      const cleanC = cleanCode(code);
      if (!cleanC) return null;

      let result = null;

      // 1. Check local DB
      const user = this.getUserByCode(cleanC);
      if (user && user.status === 'active') {
        result = {
          code: cleanC,
          discount: 20,
          discountType: 'fixed',
          referrerUsername: user.username,
          referrerName: user.name,
          isReferral: true
        };
      } else if (typeof db !== 'undefined' && db) {
        // 2. Check Firestore
        try {
          const doc = await db.collection('coupons').doc(cleanC).get();
          if (doc.exists) {
            const data = doc.data();
            if (data.isReferral && data.status === 'active') {
              result = {
                code: cleanC,
                discount: 20,
                discountType: 'fixed',
                referrerUsername: data.referrerUsername,
                referrerName: data.referrerName,
                isReferral: true
              };
            }
          }
        } catch (e) {}
      }

      if (result && phone) {
        result.usage = await this.checkPhoneReferralUsage(cleanC, phone);
      }

      return result;
    },

    // 9. Process Referral Purchase (Crucial Hook called upon Order Payment)
    // - Customer ALWAYS gets flat ₹20 discount per checkout (applied at checkout, unlimited times)
    // - Referrer earns flat ₹100 CASH for the FIRST 2 orders per customer mobile number only
    // - For 3rd or more orders by the same mobile number:
    //   * Referrer receives ₹0
    //   * The order details are NOT added to the referrer's dashboard/table ("vaga page la athe number 2 time mela buy pannum pothu avaga details su show aga kutathu")
    async recordReferralPurchase({ code, customerName, customerPhone, customerEmail, orderId, orderTotal }) {
      const cleanC = cleanCode(code);
      if (!cleanC) return { success: false, reason: 'No code' };
      const phone10 = cleanPhoneDigits(customerPhone);

      const localDB = getLocalDB();
      const userIndex = localDB.users.findIndex(u => u.referralCode.toUpperCase() === cleanC);

      if (userIndex === -1) {
        console.warn(`[ReferralsService] Code "${cleanC}" not found in local DB.`);
        return { success: false, reason: 'Referrer not found' };
      }

      const user = localDB.users[userIndex];

      // Check how many referral reward purchases this specific phone number has already made under this partner's code
      let phoneRewardCount = 0;
      if (phone10 && phone10.length === 10) {
        if (Array.isArray(user.referrals)) {
          const matched = user.referrals.filter(r => {
            const rawP = cleanPhoneDigits(r.phoneRaw || r.customerPhone || '');
            return rawP === phone10;
          });
          phoneRewardCount = matched.length;
        }

        try {
          const usageKey = 'krm_ref_usage_' + phone10 + '_' + cleanC;
          const cached = parseInt(localStorage.getItem(usageKey) || '0', 10);
          if (cached > phoneRewardCount) phoneRewardCount = cached;
        } catch (e) {}

        if (typeof db !== 'undefined' && db) {
          try {
            const usageDoc = await db.collection('referral_usages').doc(`${phone10}_${cleanC}`).get();
            if (usageDoc.exists) {
              const fsCount = usageDoc.data().count || 0;
              if (fsCount > phoneRewardCount) phoneRewardCount = fsCount;
            }
          } catch (e) {}
        }
      }

      // 🛑 USER RULE:
      // "ana itha 2 times per number number earn panravagalukutha i mean athuku apram atha code ta use panna atha ode create pannavagaluku 100 rupees kitaiyathu soo vaga page la athe number 2 time mela buy pannum pothu avaga details su show aga kutathu."
      if (phoneRewardCount >= 2) {
        console.log(`[ReferralsService] Order ${orderId}: Mobile ${phone10} has already used code ${cleanC} 2 times. Customer received ₹20 discount, but partner ${user.name} does not receive ₹100 commission and details are NOT added to partner's list.`);
        return {
          success: true,
          rewardGiven: false,
          reason: 'Customer received ₹20 discount. Referrer reward cap (max 2 orders per mobile) reached.'
        };
      }

      // Referrer earns ₹100 for this order (Order #1 or #2)
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newReferralRecord = {
        id: 'REF-' + Date.now(),
        customerName: customerName || 'Valued Customer',
        customerPhone: maskPhone(customerPhone),
        phoneRaw: phone10 || customerPhone || '',
        customerEmail: customerEmail || '',
        orderId: orderId || ('ORD-' + Date.now()),
        orderTotal: orderTotal || '₹0.00',
        discount: 20,    // Customer saved flat ₹20 per checkout
        commission: 100, // Referrer earned flat ₹100
        date: dateStr,
        time: timeStr,
        timestamp: Date.now()
      };

      // Update Referrer numbers (strictly +100 for eligible order)
      user.referralsCount = (user.referralsCount || 0) + 1;
      user.totalEarned = (user.totalEarned || 0) + 100;
      user.pendingBalance = (user.pendingBalance || 0) + 100;
      if (!Array.isArray(user.referrals)) user.referrals = [];
      user.referrals.unshift(newReferralRecord);

      // Save local DB
      localDB.users[userIndex] = user;
      saveLocalDB(localDB);

      // Update local usage counter in localStorage
      if (phone10) {
        try {
          const usageKey = 'krm_ref_usage_' + phone10 + '_' + cleanC;
          localStorage.setItem(usageKey, String(phoneRewardCount + 1));
        } catch (e) {}
      }

      // If this user is currently logged in, update active session
      const active = this.getActiveUser();
      if (active && active.username === user.username) {
        this.setActiveUser(user);
      }

      // Sync with Firestore in background
      syncUserToFirestore(user);
      if (typeof db !== 'undefined' && db) {
        try {
          // Log referral transaction in Firestore
          db.collection('referral_logs').add({
            ...newReferralRecord,
            referrerUsername: user.username,
            referrerCode: cleanC,
            phoneRaw: phone10
          });

          // Increment referral_usages document
          if (phone10) {
            const usageDocId = `${phone10}_${cleanC}`;
            db.collection('referral_usages').doc(usageDocId).set({
              phone: phone10,
              code: cleanC,
              count: firebase.firestore.FieldValue.increment(1),
              lastUsedAt: firebase.firestore.FieldValue.serverTimestamp(),
              customerName: customerName || 'Customer'
            }, { merge: true });
          }
        } catch (e) {
          console.warn('[ReferralsService] Firestore referral log error:', e);
        }
      }

      // Realtime cross-tab / cross-window broadcast
      broadcastChange('referral_purchase', {
        username: user.username,
        code: cleanC,
        record: newReferralRecord,
        totalEarned: user.totalEarned,
        pendingBalance: user.pendingBalance
      });

      console.log(`[ReferralsService] Successfully recorded referral! Referrer: ${user.name}, Commission: +₹100, Total Earned: ₹${user.totalEarned}`);
      return { success: true, rewardGiven: true, user: user, record: newReferralRecord };
    },

    // 10. Save / Update Bank Account & IFSC Details
    saveBankDetails(username, bankData) {
      const cleanU = cleanUsername(username);
      const localDB = getLocalDB();
      const idx = localDB.users.findIndex(u => u.username.toLowerCase() === cleanU);
      if (idx === -1) throw new Error('User not found.');

      if (!bankData.accountNumber || bankData.accountNumber.trim().length < 8) {
        throw new Error('Please enter a valid Bank Account Number (minimum 8-9 digits).');
      }
      if (!bankData.ifscCode || bankData.ifscCode.trim().length < 4) {
        throw new Error('Please enter a valid IFSC Code (e.g. SBIN0001234).');
      }

      const cleanBank = {
        accountHolder: (bankData.accountHolder || localDB.users[idx].name).trim(),
        accountNumber: bankData.accountNumber.trim(),
        ifscCode: bankData.ifscCode.trim().toUpperCase(),
        bankName: (bankData.bankName || 'Bank Account').trim(),
        upiId: (bankData.upiId || '').trim(),
        updatedAt: Date.now()
      };

      localDB.users[idx].bankDetails = cleanBank;
      if (cleanBank.upiId) {
        localDB.users[idx].upiId = cleanBank.upiId;
      }

      saveLocalDB(localDB);
      this.setActiveUser(localDB.users[idx]);
      syncUserToFirestore(localDB.users[idx]);
      broadcastChange('bank_updated', { username: cleanU, bankDetails: cleanBank });
      return cleanBank;
    },

    // 11. Update User Profile (UPI ID, Phone, etc.)
    updateProfile(username, updates) {
      const cleanU = cleanUsername(username);
      const localDB = getLocalDB();
      const idx = localDB.users.findIndex(u => u.username.toLowerCase() === cleanU);
      if (idx === -1) throw new Error('User not found.');

      if (updates.upiId !== undefined) localDB.users[idx].upiId = updates.upiId.trim();
      if (updates.phone !== undefined) localDB.users[idx].phone = updates.phone.trim();
      if (updates.email !== undefined) localDB.users[idx].email = updates.email.trim();

      saveLocalDB(localDB);
      this.setActiveUser(localDB.users[idx]);
      syncUserToFirestore(localDB.users[idx]);
      broadcastChange('profile_updated', { username: cleanU });
      return localDB.users[idx];
    },

    // Check 24-hour withdrawal cooldown for a user
    getWithdrawalCooldown(userOrUsername) {
      let user = userOrUsername;
      if (typeof userOrUsername === 'string') {
        user = this.getUserByUsername(userOrUsername);
      }
      if (!user) {
        return {
          canWithdraw: false,
          timeLeftMs: 0,
          hoursLeft: 0,
          minutesLeft: 0,
          formattedTimeLeft: '',
          nextAvailableTime: null,
          lastWithdrawalTime: null,
          reason: 'User not found'
        };
      }

      const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
      let lastTime = 0;

      if (typeof user.lastWithdrawalAt === 'number') {
        lastTime = Math.max(lastTime, user.lastWithdrawalAt);
      }

      if (Array.isArray(user.payouts)) {
        user.payouts.forEach(p => {
          if (p && p.status !== 'rejected') {
            const t = Number(p.requestedAt) || (p.id && Number(String(p.id).replace('PAY-', ''))) || 0;
            if (t > lastTime) lastTime = t;
          }
        });
      }

      const localDB = getLocalDB();
      if (Array.isArray(localDB.payoutRequests)) {
        const cleanU = (user.username || '').toLowerCase();
        localDB.payoutRequests.forEach(p => {
          if (p && (p.username || '').toLowerCase() === cleanU && p.status !== 'rejected') {
            const t = Number(p.requestedAt) || (p.id && Number(String(p.id).replace('PAY-', ''))) || 0;
            if (t > lastTime) lastTime = t;
          }
        });
      }

      if (!lastTime) {
        return {
          canWithdraw: true,
          timeLeftMs: 0,
          hoursLeft: 0,
          minutesLeft: 0,
          formattedTimeLeft: '',
          nextAvailableTime: null,
          lastWithdrawalTime: null
        };
      }

      const now = Date.now();
      const elapsed = now - lastTime;
      const timeLeftMs = Math.max(0, COOLDOWN_MS - elapsed);

      if (timeLeftMs <= 0) {
        return {
          canWithdraw: true,
          timeLeftMs: 0,
          hoursLeft: 0,
          minutesLeft: 0,
          formattedTimeLeft: '',
          nextAvailableTime: null,
          lastWithdrawalTime: new Date(lastTime)
        };
      }

      const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
      let formattedTimeLeft = '';
      if (hoursLeft > 0) {
        formattedTimeLeft = `${hoursLeft}h ${minutesLeft}m`;
      } else {
        formattedTimeLeft = `${Math.max(1, minutesLeft)}m`;
      }

      const nextAvailableTime = new Date(lastTime + COOLDOWN_MS);

      return {
        canWithdraw: false,
        timeLeftMs: timeLeftMs,
        hoursLeft: hoursLeft,
        minutesLeft: minutesLeft,
        formattedTimeLeft: formattedTimeLeft,
        nextAvailableTime: nextAvailableTime,
        lastWithdrawalTime: new Date(lastTime)
      };
    },

    // 12. Request Payout (User Side - Asks specific amount)
    requestPayout(username, amount) {
      const cleanU = cleanUsername(username);
      const localDB = getLocalDB();
      const idx = localDB.users.findIndex(u => u.username.toLowerCase() === cleanU);
      if (idx === -1) throw new Error('User not found.');

      const user = localDB.users[idx];
      const reqAmount = Number(amount);

      // Enforce 24-hour withdrawal cooldown
      const cooldown = this.getWithdrawalCooldown(user);
      if (!cooldown.canWithdraw) {
        throw new Error(`ஒரு முறை பணம் எடுத்த பிறகு அடுத்த 24 மணி நேரத்திற்குப் பிறகே மீண்டும் எடுக்க முடியும். (Withdrawal limit: Once every 24 hours). Next withdrawal available in ${cooldown.formattedTimeLeft}.`);
      }

      if (isNaN(reqAmount) || reqAmount < 100) {
        throw new Error('Minimum withdrawal amount is ₹100 (1 referral).');
      }
      if (reqAmount > user.pendingBalance) {
        throw new Error(`Insufficient balance! Your available balance is ₹${user.pendingBalance}.`);
      }
      if (!user.bankDetails || !user.bankDetails.accountNumber || !user.bankDetails.ifscCode) {
        throw new Error('தயவுசெய்து உங்கள் வங்கி கணக்கு எண் மற்றும் IFSC குறியீட்டை பதிவு செய்யவும். (Please enter and save your Bank Account & IFSC details first).');
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      const payout = {
        id: 'PAY-' + Date.now(),
        username: user.username,
        name: user.name,
        phone: user.phone,
        amount: reqAmount,
        bankDetails: user.bankDetails,
        accountNumber: user.bankDetails.accountNumber,
        ifscCode: user.bankDetails.ifscCode,
        accountHolder: user.bankDetails.accountHolder,
        bankName: user.bankDetails.bankName,
        upiId: user.bankDetails.upiId || user.upiId || '',
        status: 'pending',
        requestedAt: Date.now(),
        date: dateStr,
        time: timeStr,
        txnRef: null,
        completedAt: null,
        isShowcase: !!user.isShowcase
      };

      if (!user.payouts) user.payouts = [];
      user.payouts.unshift(payout);
      user.pendingBalance -= reqAmount;
      user.lastWithdrawalAt = payout.requestedAt;

      if (!localDB.payoutRequests) localDB.payoutRequests = [];
      localDB.payoutRequests.unshift(payout);

      saveLocalDB(localDB);
      this.setActiveUser(user);
      syncUserToFirestore(user);
      syncPayoutToFirestore(payout);

      broadcastChange('payout_requested', { username: user.username, payout: payout });
      return payout;
    },

    // ------------------------------------------------------------------------
    // ADMIN FUNCTIONS
    // ------------------------------------------------------------------------

    // 13. Get All Referrers for Admin (default: only real users, showcase accounts excluded so numbers start at 0)
    getAllReferrers(includeShowcase = false) {
      const localDB = getLocalDB();
      const showcaseUsernames = ['karthik_krm', 'kavitha_krm', 'vignesh_krm'];
      let list = (localDB.users || []);
      if (!includeShowcase) {
        list = list.filter(u => !u.isShowcase && !showcaseUsernames.includes(u.username));
      }
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },

    // 14. Get All Payout Requests for Admin (default: only real payouts, showcase payouts excluded)
    getPayoutRequests(statusFilter = 'all', includeShowcase = false) {
      const localDB = getLocalDB();
      const showcaseUsernames = ['karthik_krm', 'kavitha_krm', 'vignesh_krm'];
      let list = Array.isArray(localDB.payoutRequests) ? localDB.payoutRequests : [];
      if (!includeShowcase) {
        list = list.filter(p => !p.isShowcase && !showcaseUsernames.includes(p.username));
      }
      if (statusFilter && statusFilter !== 'all') {
        list = list.filter(p => p.status === statusFilter);
      }
      return list.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
    },

    // 15. Admin Complete / Mark Payout as Paid (Live Sync)
    adminCompletePayout(payoutId, txnReference) {
      if (!payoutId) throw new Error('Payout ID required.');
      const localDB = getLocalDB();
      
      const pIdx = (localDB.payoutRequests || []).findIndex(p => p.id === payoutId);
      if (pIdx === -1) throw new Error('Payout request not found.');

      const payout = localDB.payoutRequests[pIdx];
      payout.status = 'completed';
      payout.completedAt = Date.now();
      payout.txnRef = txnReference || 'TXN-' + Date.now().toString().slice(-8);

      // Also update user's own record
      const uIdx = (localDB.users || []).findIndex(u => u.username.toLowerCase() === payout.username.toLowerCase());
      if (uIdx !== -1) {
        const user = localDB.users[uIdx];
        user.paidBalance = (user.paidBalance || 0) + payout.amount;
        if (Array.isArray(user.payouts)) {
          const upIdx = user.payouts.findIndex(p => p.id === payoutId);
          if (upIdx !== -1) {
            user.payouts[upIdx].status = 'completed';
            user.payouts[upIdx].completedAt = payout.completedAt;
            user.payouts[upIdx].txnRef = payout.txnRef;
          }
        }
        syncUserToFirestore(user);
        const active = this.getActiveUser();
        if (active && active.username === user.username) {
          this.setActiveUser(user);
        }
      }

      saveLocalDB(localDB);
      syncPayoutToFirestore(payout);

      broadcastChange('payout_completed', {
        payoutId: payout.id,
        username: payout.username,
        amount: payout.amount,
        txnRef: payout.txnRef
      });

      return payout;
    },

    // 16. Admin Reject Payout & Refund Balance
    adminRejectPayout(payoutId, reason = 'Bank details mismatched') {
      if (!payoutId) throw new Error('Payout ID required.');
      const localDB = getLocalDB();

      const pIdx = (localDB.payoutRequests || []).findIndex(p => p.id === payoutId);
      if (pIdx === -1) throw new Error('Payout request not found.');

      const payout = localDB.payoutRequests[pIdx];
      payout.status = 'rejected';
      payout.rejectReason = reason;
      payout.rejectedAt = Date.now();

      // Refund balance to the user
      const uIdx = (localDB.users || []).findIndex(u => u.username.toLowerCase() === payout.username.toLowerCase());
      if (uIdx !== -1) {
        const user = localDB.users[uIdx];
        user.pendingBalance = (user.pendingBalance || 0) + payout.amount;
        if (Array.isArray(user.payouts)) {
          const upIdx = user.payouts.findIndex(p => p.id === payoutId);
          if (upIdx !== -1) {
            user.payouts[upIdx].status = 'rejected';
            user.payouts[upIdx].rejectReason = reason;
          }
        }
        // Recalculate lastWithdrawalAt based on remaining non-rejected payouts
        let latestRemaining = 0;
        if (Array.isArray(user.payouts)) {
          user.payouts.forEach(p => {
            if (p && p.status !== 'rejected') {
              const t = Number(p.requestedAt) || (p.id && Number(String(p.id).replace('PAY-', ''))) || 0;
              if (t > latestRemaining) latestRemaining = t;
            }
          });
        }
        user.lastWithdrawalAt = latestRemaining;
        syncUserToFirestore(user);
        const active = this.getActiveUser();
        if (active && active.username === user.username) {
          this.setActiveUser(user);
        }
      }

      saveLocalDB(localDB);
      syncPayoutToFirestore(payout);

      broadcastChange('payout_rejected', {
        payoutId: payout.id,
        username: payout.username,
        amount: payout.amount,
        reason: reason
      });

      return payout;
    },

    // 17. Admin Direct Balance Pay / Settle
    adminSettleBalance(username, amount, txnReference) {
      const cleanU = cleanUsername(username);
      const localDB = getLocalDB();
      const idx = localDB.users.findIndex(u => u.username.toLowerCase() === cleanU);
      if (idx === -1) throw new Error('Referrer not found.');

      const user = localDB.users[idx];
      const settleAmt = Number(amount) || user.pendingBalance;

      if (settleAmt <= 0) throw new Error('No balance to settle.');

      const now = new Date();
      const payout = {
        id: 'PAY-' + Date.now(),
        username: user.username,
        name: user.name,
        phone: user.phone,
        amount: settleAmt,
        bankDetails: user.bankDetails,
        accountNumber: user.bankDetails ? user.bankDetails.accountNumber : '',
        ifscCode: user.bankDetails ? user.bankDetails.ifscCode : '',
        accountHolder: user.bankDetails ? user.bankDetails.accountHolder : user.name,
        bankName: user.bankDetails ? user.bankDetails.bankName : '',
        upiId: (user.bankDetails ? user.bankDetails.upiId : '') || user.upiId || 'Direct Settlement',
        status: 'completed',
        requestedAt: Date.now(),
        completedAt: Date.now(),
        txnRef: txnReference || 'TXN-' + Math.floor(100000 + Math.random() * 900000),
        date: now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      if (!user.payouts) user.payouts = [];
      user.payouts.unshift(payout);
      user.pendingBalance = Math.max(0, user.pendingBalance - settleAmt);
      user.paidBalance = (user.paidBalance || 0) + settleAmt;

      if (!localDB.payoutRequests) localDB.payoutRequests = [];
      localDB.payoutRequests.unshift(payout);

      saveLocalDB(localDB);
      syncUserToFirestore(user);
      syncPayoutToFirestore(payout);

      broadcastChange('payout_completed', {
        payoutId: payout.id,
        username: user.username,
        amount: settleAmt,
        txnRef: payout.txnRef
      });

      return user;
    },

    // 18. Admin Toggle Status (Active / Inactive)
    toggleUserStatus(username) {
      const cleanU = cleanUsername(username);
      const localDB = getLocalDB();
      const idx = localDB.users.findIndex(u => u.username.toLowerCase() === cleanU);
      if (idx === -1) throw new Error('User not found.');

      const newStatus = localDB.users[idx].status === 'active' ? 'inactive' : 'active';
      localDB.users[idx].status = newStatus;

      saveLocalDB(localDB);
      syncUserToFirestore(localDB.users[idx]);

      // Also toggle in coupons
      if (typeof db !== 'undefined' && db) {
        try {
          db.collection('coupons').doc(localDB.users[idx].referralCode).update({ status: newStatus });
        } catch(e) {}
      }

      broadcastChange('user_status_toggled', { username: cleanU, status: newStatus });
      return localDB.users[idx];
    },

    // 19. Real-time Live Listener Subscription for UI (Cross-tab, cross-window)
    onUpdate(callback) {
      if (typeof callback !== 'function') return () => {};

      const channelHandler = (e) => callback(e.data || {});
      const windowHandler = (e) => callback(e.detail || {});
      const storageHandler = (e) => {
        if (e.key === PING_KEY || e.key === STORAGE_KEY) {
          callback({ type: 'storage_change', key: e.key });
        }
      };

      if (bChannel) bChannel.addEventListener('message', channelHandler);
      window.addEventListener('krm:referralsUpdated', windowHandler);
      window.addEventListener('storage', storageHandler);

      return () => {
        if (bChannel) bChannel.removeEventListener('message', channelHandler);
        window.removeEventListener('krm:referralsUpdated', windowHandler);
        window.removeEventListener('storage', storageHandler);
      };
    },

    // Helper: Reset only real referrals & payouts to clean 0 (preserves 3 showcase accounts)
    resetRealReferralsData() {
      const localDB = getLocalDB();
      const showcaseUsernames = ['karthik_krm', 'kavitha_krm', 'vignesh_krm'];
      localDB.users = (localDB.users || []).filter(u => showcaseUsernames.includes(u.username));
      localDB.payoutRequests = (localDB.payoutRequests || []).filter(p => showcaseUsernames.includes(p.username));
      saveLocalDB(localDB);
      broadcastChange('data_reset');
      return true;
    },

    // Helper: Format registration date and time nicely
    formatCreatedDateTime(user) {
      if (!user) return 'N/A';
      if (user.createdDate && user.createdTime) {
        return `${user.createdDate} • ${user.createdTime}`;
      }
      if (user.createdAt) {
        const d = new Date(user.createdAt);
        if (!isNaN(d.getTime())) {
          const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          return `${dateStr} • ${timeStr}`;
        }
      }
      return 'Just now';
    },

    // 20. Test Purchase Simulator (Instant Preview)
    async simulateTestPurchase(code, customerName = 'Simulated Customer') {
      const randomTotal = ['₹349.00', '₹499.00', '₹299.00', '₹699.00'][Math.floor(Math.random() * 4)];
      const randomPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
      return await this.recordReferralPurchase({
        code: code,
        customerName: customerName,
        customerPhone: randomPhone,
        customerEmail: 'buyer' + Math.floor(Math.random() * 1000) + '@example.com',
        orderId: 'ORD-' + Math.floor(1000000000 + Math.random() * 9000000000),
        orderTotal: randomTotal
      });
    }
  };
})();

// Make globally accessible
if (typeof window !== 'undefined') {
  window.ReferralsService = ReferralsService;
}
