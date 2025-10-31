## 📸 Serverless Passport Photo Converter (India Standard)

An event-driven, cloud-native application to automatically convert user-uploaded images to official Indian passport/visa photo specifications ($35\text{mm} \times 45\text{mm}$) using a React frontend and Python-based AWS Lambda processing.

[](https://reactjs.org/)
[](https://aws.amazon.com/s3/)
[](https://aws.amazon.com/lambda/)
[](https://www.python.org/)
[](https://pypi.org/project/Pillow/)

-----

## 💡 Project Overview

This project implements a fully serverless, event-driven architecture to provide an instant passport photo conversion service. The goal is to deliver the processed photo to the user's browser immediately after processing, providing a seamless user experience.

### Key Features:

  * **Serverless Efficiency:** Utilizes AWS Lambda and S3 for cost-effective and auto-scaling image processing.
  * **React User Interface:** A simple, modern frontend for effortless image selection and upload (referencing the [PassportImgConverterIndia](https://github.com/BlackRepper/PassportImgConverterIndia) repository).
  * **Automatic Trigger:** An **S3 event** triggers the Python processing function upon file upload.
  * **Indian Standard Compliance:** The Python Lambda function is specifically configured to output images in the required **$35\text{mm} \times 45\text{mm}$** dimensions.
  * **Instant Download:** The frontend actively monitors for the processed image in S3 and automatically initiates the download to the user's browser.

-----

## 🏗️ Architecture and Data Flow

The entire workflow is automated, starting from the user's browser and ending with a final download from S3.

1.  **React Frontend:** User selects and uploads the original image file.
2.  **S3 Source Bucket:** The original image is stored here. This bucket is configured with an event notification.
3.  **S3 Trigger ($\rightarrow$ Lambda):** An `s3:ObjectCreated` event triggers the Lambda function.
4.  **AWS Lambda (Python):** The function runs the image processing logic (download, resize, crop, save as $35\text{mm} \times 45\text{mm}$).
5.  **S3 Destination Bucket:** The newly processed passport image is uploaded here.
6.  **React Frontend:** Polls the Destination Bucket. Once the processed file is detected, it generates a presigned URL and forces the automatic download.

-----

## 💻 Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | `React.js` | User interface, direct S3 upload, and automatic download logic. |
| **Storage** | `Amazon S3` | Used for both raw uploads (Source) and processed files (Destination). |
| **Compute** | `AWS Lambda` (Python 3.x) | Executes serverless image resizing and conversion. |
| **Image Processing** | `Pillow` / `OpenCV` | Python libraries essential for precise image manipulation. |
| **Download Mechanism** | `AWS SDK` / `Presigned URLs` | Enables the secure and automatic download of the final image. |

-----

## 🛠️ Implementation Steps

### 1\. AWS Cloud Setup

1.  **S3 Buckets:** Create two buckets (`Source` and `Destination`). Configure **CORS** policies on both to allow requests from your React application's domain.
2.  **IAM Role:** Create an **IAM Execution Role** for Lambda granting it `s3:GetObject` on the **Source Bucket** and `s3:PutObject` on the **Destination Bucket**.
3.  **Lambda Function:**
      * Create a Python Lambda function.
      * Create a **Lambda Layer** containing necessary image processing dependencies (like Pillow, as they are not native to the standard Python runtime).
      * **Configure Trigger:** Add the **S3 Source Bucket** as a trigger, specifically for `ObjectCreated` events.
      * The Python handler code will read the object, process it to $35\text{mm} \times 45\text{mm}$, and write it to the **Destination Bucket**.

### 2\. React Frontend Integration

The frontend (as found in the [linked repo](https://github.com/BlackRepper/PassportImgConverterIndia)) needs to be modified for the full E2E flow:

1.  **File Upload:** Implement the logic to directly upload the file to the S3 **Source Bucket** (preferably using **AWS Cognito** for temporary credentials or a pre-signed PUT URL).
2.  **Start Polling:** Immediately after the S3 upload succeeds, the React component must enter a loop (polling) that repeatedly checks the **Destination Bucket** for the new file using the predictable key (e.g., `processed/{original_filename}`).
3.  **Trigger Download:** Once the file is found:
      * Retrieve a time-limited **Presigned GET URL** for the processed S3 object.
      * Programmatically create an HTML anchor tag (`<a>`), set its `href` to the presigned URL, set the `download` attribute, and simulate a click event to force the download.

-----

## 🔒 Security Note

  * **Never** hardcode sensitive AWS keys in your React frontend. Use **Cognito Identity Pools** to provide users with short-lived, restricted IAM roles for S3 interaction.
  * The Lambda's IAM role must follow the **Principle of Least Privilege**, only allowing the minimum necessary S3 actions (`GetObject` and `PutObject`) on the designated buckets.
