# Project Documentation: PassportSnap - Serverless Passport Photo Converter

## 1\. Project Overview

The **PassportSnap** application provides a seamless, automated, and serverless solution for converting user-uploaded images into compliant, standard passport-sized photographs. The application leverages a **React** frontend for a smooth user experience and **AWS S3/Lambda** for reliable, event-driven processing.

### 1.1. Goal

To automatically resize, crop, and convert an uploaded image into a compliant passport photograph (e.g., Indian Passport size) and initiate an automatic download of the final image to the user's browser, all without requiring a dedicated server.

### 1.2. Key Features

  * **Serverless Architecture**: Low operational cost and high scalability using AWS Lambda and S3.
  * **Event-Driven Processing**: Image conversion is triggered automatically upon S3 upload.
  * **Intuitive Frontend**: Built with React for easy image selection and upload.
  * **Automatic Download**: Final processed image is immediately served back to the user for download.

-----

## 2\. Architecture & Data Flow

The architecture follows a classic serverless pattern, utilizing S3 as both storage and an event source.

### 2.1. Architectural Components

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React, AWS Amplify/SDK | User interface, image selection, and direct S3 upload. |
| **Source S3 Bucket** | Amazon S3 | Stores the original, raw user-uploaded image. |
| **Image Processor** | AWS Lambda (Python) | **Core business logic**: Triggered by S3 PUT event; handles resizing, cropping, and conversion. |
| **Destination S3 Bucket** | Amazon S3 | Stores the final, processed passport-sized image. |
| **API Gateway (Optional)** | AWS API Gateway | Used to send a notification/trigger to the frontend once the image is ready for download. |

### 2.2. Data Flow Diagram

The application follows a four-step, event-driven process:

1.  **Upload (React → S3)**: The user selects an image on the React app. The app uses the AWS SDK to securely upload the original image to the **Source S3 Bucket**.
2.  **Trigger (S3 → Lambda)**: The S3 `s3:ObjectCreated:Put` event triggers the **Python Lambda Function**. The event data includes the file name and bucket location.
3.  **Process & Store (Lambda → S3)**:
      * The Lambda function downloads the original image.
      * It processes the image (resizing, cropping) using a library like **Pillow**.
      * The converted image is uploaded to the **Destination S3 Bucket**.
4.  **Download (S3 → React)**: Once the processed image is stored, the Lambda (or a subsequent service) notifies the frontend. The React app then generates a temporary, signed URL for the processed image and initiates the automatic download in the user's browser.

-----

## 3\. Technology Stack

### 3.1. Frontend

  * **Framework**: React (using create-react-app or similar).
  * **Styling**: CSS/Sass/Tailwind (specific to your implementation).
  * **AWS Integration**: AWS Amplify or direct AWS SDK for JavaScript (to handle S3 uploads and secure temporary downloads).
  * **Repository**: [BlackRepper/PassportImgConverterIndia](https://github.com/BlackRepper/PassportImgConverterIndia)

### 3.2. Backend (AWS Serverless)

  * **Compute**: AWS Lambda (Python 3.x)
  * **Image Processing Library**: **Pillow** (Python Imaging Library).
  * **Storage**: Amazon S3 (Two Buckets: Source/Raw and Destination/Processed).
  * **Infrastructure as Code (Recommended)**: AWS SAM or Terraform (for reliable deployment).

-----

## 4\. Setup and Deployment

This section outlines the steps required to get the application running.

### 4.1. AWS Infrastructure Setup (Backend) Examples

1.  **Create S3 Buckets**:
      * Create **`passport-snap-raw-images`** (Source Bucket).
      * Create **`passport-snap-processed-images`** (Destination Bucket).
2.  **Create Lambda Function (Python)**:
      * Write the Python code using **Pillow** to perform the conversion logic (resize, crop to required dimensions, and save with a standard format/quality).
      * **Lambda Handler Logic**:
          * Receive S3 event data.
          * Get the object key/name.
          * Download the image from the Source Bucket.
          * Process the image.
          * Upload the processed image to the Destination Bucket.
      * Package the function with the **Pillow** dependency.
3.  **Configure IAM Role**:
      * The Lambda's execution role **must** have permissions for:
          * `s3:GetObject` on the **Source Bucket**.
          * `s3:PutObject` on the **Destination Bucket**.
          * CloudWatch Logs access.
4.  **Set S3 Trigger**:
      * In the AWS console (or via IAC), configure the **`passport-snap-raw-images`** (Source) bucket to trigger the Lambda function on the `ObjectCreated (Put)` event.

### 4.2. Frontend Setup (React)

1.  **Clone the Repository**:

    ```bash
    git clone https://github.com/BlackRepper/PassportImgConverterIndia
    cd PassportImgConverterIndia
    ```

2.  **Install Dependencies**:

    ```bash
    npm install
    ```

3.  **Configure AWS Credentials**:

      * The frontend requires the **AWS Region**, the **Source S3 Bucket Name**, and appropriate **IAM Credentials** (or a Cognito Identity Pool) to securely upload files directly to S3.
      * Update environment variables or configuration files with these details.

4.  **Implement Download Polling/Notification**:

      * The React code needs a mechanism to detect when the processed image is ready. Options include:
          * **Polling**: The frontend periodically checks the Destination S3 bucket for the file name.
          * **Real-time**: The Lambda function publishes a message to an **SNS topic** or **DynamoDB table**, and the React app subscribes to updates via **WebSockets** or **API Gateway**.

5.  **Run the Application**:

    ```bash
    npm start
    ```

-----

## 5\. Implementation Details

### 5.1. Python Lambda (Image Processing)

The core logic must handle standard passport dimensions. For **Indian Passport photos**, the requirements are:

  * **Size**: 35mm x 45mm (equivalent to 350 x 450 pixels at 100 DPI).
  * **Face Coverage**: The face should cover 70-80% of the photograph.

The Pillow library will be used for:

1.  Opening the image.
2.  Resizing to the target dimensions.
3.  Ensuring the output format is JPEG/JPG.
4.  Writing the processed image back to a memory stream before uploading to S3.

### 5.2. Frontend Download Logic

The successful delivery of the final image requires the React application to generate a **presigned URL** for the processed image in the Destination S3 bucket.

1.  The React app detects the file is ready (via polling or notification).
2.  It uses the AWS SDK to request a temporary, time-limited **Presigned URL** for the object.
3.  It sets the browser's location to this URL, which forces the automatic download of the passport photo.
