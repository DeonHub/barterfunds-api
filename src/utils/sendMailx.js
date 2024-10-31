require("dotenv").config();
const transporterx = require("./transporterx");
const hostEmail = process.env.EMAIL_HOST_USER;
const baseUrl = process.env.BASE_URL;
const currentYear = new Date().getFullYear();

const sendMailx = (
  userEmail,
  token,
  subject,
  action,
  header1,
  header2,
  header3,
  buttonText
) => {
  // Define email options
  const mailOptions = {
    from: '"Chrissy\'s Imports" <noreply@chrissysimports.com>',
    to: userEmail,
    subject: subject,
    html: `
<html>
<head>
  <style>
    @media only screen and (max-width: 600px) {
      .u-row-container, .u-col-100, .v-container-padding-padding {
        width: 100% !important;
        padding: 10px !important;
      }
      img {
        width: 100% !important;
        height: auto !important;
      }
      .v-button {
        width: 80% !important;
      }
    }
  </style>
</head>

<body style="background-color: white; margin: 0; padding: 0">
  <table style="margin: 0 auto; width: 100%; max-width: 600px;">
    <tbody>
      <tr>
        <td style="word-break: break-word; vertical-align: top;">
          <div style="padding: 0; background-color: transparent; text-align:center;">
            <div>
                <a href="https://chat.whatsapp.com/KGbRyto5zKL54jiiSA4fQ1" target="_blank">
                    <img
                      src="https://res.cloudinary.com/bloody123/image/upload/v1730300258/hsabmayblp8ocavne9bu.png"
                      alt="Logo"
                      title="Logo"
                      style="
                        height: auto;
                        width: 80%;
                       
                      "
                    
                      
                    /></a>
            </div>
            <div style="margin: 0 auto; min-width: 320px; max-width: 100%; background-color: #fff; border: 1px solid black; border-radius: 5px; padding: 0 20px;">
              
              <!-- Header Section -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="padding-top: 20px; margin-bottom:-10%;">
                <tr>
                  <td align="center">
                    <p style="font-size: 25px; font-weight: bold; margin-bottom:-2%;">${header1}</p>
                  </td>
                </tr>
              </table>

              <!-- Body Section -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                <tr>
                  <td align="center" style="padding: 10px;">
                    <p style="font-size: 18px; line-height: 170%;">${header2}</p>
                  </td>
                </tr>
              </table>

              <!-- Button Section -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="padding-bottom: 10px; margin-bottom: 10%;">
                <tr>
                  <td align="center">
                    <a href="https://chat.whatsapp.com/KGbRyto5zKL54jiiSA4fQ1" target="_blank" style="display: inline-block; padding: 12px 48px; color: #ffffff; background-color: #074341; border-radius: 4px; text-align: center; text-decoration: none; font-size: 16px;">
                      <strong>${buttonText}</strong>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Image Gallery Section -->
             
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; padding: 10px; overflow: scroll;">
                    <a href="https://chat.whatsapp.com/KGbRyto5zKL54jiiSA4fQ1" target="_blank"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTC0S2BK8fAoLvBIsgswmWcHBGbV_3ZuM0j7A&s" style="width: 200px; height: auto; border-radius: 4px;"></a>
                    <a href="https://chat.whatsapp.com/KGbRyto5zKL54jiiSA4fQ1" target="_blank"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqHsoPiJUsqPu4HnpAWBxPcdsQipEnBNfOAA&s" style="width: 200px; height: auto; border-radius: 4px;"></a>
                    <a href="https://chat.whatsapp.com/KGbRyto5zKL54jiiSA4fQ1" target="_blank"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1BtnZFAHTBLMC_cuMAfqJsSIiRb_n7xhvKCMAZPZrku1wZnqcPuMUn3R0PR5h4OGjmhc&usqp=CAU" style="width: 200px; height: auto; border-radius: 4px;"></a>
                  </div>

                  <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; padding: 10px; overflow: scroll;">
                    <a href="https://chat.whatsapp.com/KGbRyto5zKL54jiiSA4fQ1" target="_blank"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkNXYOEj7yhOWWCjby6McveO9aDMdu4uc8Xw&s" style="width: 200px; height: auto; border-radius: 4px;"></a>
                    <a href="https://chat.whatsapp.com/KGbRyto5zKL54jiiSA4fQ1" target="_blank"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQu3Qcb9Z_Sm1UpHUl801bMHOy9izOVS3bbBQ&s" style="width: 200px; height: auto; border-radius: 4px;"></a>
                    <a href="https://chat.whatsapp.com/KGbRyto5zKL54jiiSA4fQ1" target="_blank"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc2ZfL-SNfWDXMr4-n_KiyMH_p1XTL0amRLQ&s" style="width: 200px; height: auto; border-radius: 4px;"></a>
                  </div>
             
              
            </div>

            <!-- Footer Section -->
            <div style="text-align: center; color: #000; margin: 5% 0;">
              <p>&copy; 2019 - ${currentYear} Chrissy's Imports. All Rights Reserved.</p>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
    `,
};


  // Send the email
  transporterx.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error occurred:", error.message);
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });
};

module.exports = sendMailx;
