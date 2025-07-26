// // lib/services/smsService.ts
// import { messaging } from '@/lib/firebase/admin';
// import twilio from 'twilio';


// export const sendAdminSMSNotification = async (
//   message: string, 
//   adminPhone: string
// ) => {
//   try {
//     // This sends a push notification. For actual SMS, you'd use Twilio or similar
//     // This is a placeholder implementation
//     await messaging.sendToTopic('admin-notifications', {
//       notification: {
//         title: 'Pharmacy Notification',
//         body: message
//       },
//       data: {
//         type: 'discount-alert',
//         phone: adminPhone
//       }
//     });
    
//     console.log('Admin notification sent successfully');
//     return true;
//   } catch (error) {
//     console.error('Error sending admin notification:', error);
//     return false;
//   }
// };

// // export const sendAdminSMSNotification = async (message: string, adminPhone: string) => {
// //   try {
// //     const client = twilio(
// //       process.env.TWILIO_ACCOUNT_SID,
// //       process.env.TWILIO_AUTH_TOKEN
// //     );

// //     await client.messages.create({
// //       body: message,
// //       from: process.env.TWILIO_PHONE_NUMBER,
// //       to: adminPhone
// //     });

// //     console.log('SMS sent successfully');
// //     return true;
// //   } catch (error) {
// //     console.error('Error sending SMS:', error);
// //     return false;
// //   }
// // };

