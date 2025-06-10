"use client";
 
import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadedKey, setUploadedKey] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      setMessage(`Uploaded: ${data.originalname}`);
      setUploadedKey(data.key);
    } else {
      setMessage(data.error || "Upload failed.");
      alert(data.error || "Upload failed.");
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    const convertedUrl = `https://paasportconverted.s3.ap-south-1.amazonaws.com/${uploadedKey}`;
    let found = false;
    let attempts = 0;

    while (!found && attempts < 20) {
      try {
        const res = await fetch(convertedUrl, { method: "HEAD" });
        if (res.ok) {
          found = true;
          const link = document.createElement("a");
          link.href = convertedUrl;
          link.download = uploadedKey;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setMessage("Downloaded passport photo!");
        } else {
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch {
        await new Promise((r) => setTimeout(r, 3000));
      }
      attempts++;
    }
    if (!found) setMessage("Conversion timed out. Try again later.");
    setIsConverting(false);
  };

  return (
    <div className="upload-container">
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleChange} className="file-input" />
        <button type="submit" className="modern-btn upload-btn">Upload</button>
        <div className="message">{message}</div>
      </form>
      {uploadedKey && (
        <button type="button" onClick={handleConvert} disabled={isConverting} className="modern-btn convert-btn">
          {isConverting ? <span className="spinner" /> : "Convert & Download"}
        </button>
      )}
      <style jsx>{`
        .upload-container {
         position: absolute;
          top: 40%;
          left: 36%;
          max-width: 400px;
          margin: 40px auto;
          padding: 32px 24px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .file-input {
          margin-bottom: 16px;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #ddd;
          font-size: 1rem;
        }
        .modern-btn {
          padding: 10px 28px;
          margin: 8px 0;
          border: none;
          border-radius: 8px;
          background: linear-gradient(90deg, #4f8cff 0%, #2355e6 100%);
          color: #fff;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          box-shadow: 0 2px 8px rgba(79,140,255,0.08);
        }
        .modern-btn:disabled {
          background: #b3c7f7;
          cursor: not-allowed;
        }
        .upload-btn {
          margin-right: 10px;
        }
        .convert-btn {
          background: linear-gradient(90deg, #00c6a7 0%, #1e90ff 100%);
        }
        .message {
          margin-top: 10px;
          color: #2355e6;
          font-weight: 500;
        }
        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid #b3c7f7;
          border-top: 3px solid #2355e6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          vertical-align: middle;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </div>
  );
}