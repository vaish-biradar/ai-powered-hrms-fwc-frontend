import axios from "axios";
import { Application, DocumentType } from "@/types/dashboard";

export const useDocumentPreview = () => {
  const handleView = async (application: Application, documentType: DocumentType) => {
    const containerMap = {
      resume: "resumes",
      jd: "jobdescriptions",
      report: "reports",
    };

    const urlMap = {
      resume: application.resume_url,
      jd: application.jd_url,
      report: application.report_url,
    };

    const titleMap = {
      resume: "Resume",
      jd: "Job Description",
      report: "Match Report",
    };

    const fileName = urlMap[documentType];
    const container = containerMap[documentType];
    const title = titleMap[documentType];

    if (!fileName) {
      console.warn(`⚠️ No URL found for ${title}. Application:`, application);
      return;
    }

    try {

      const response = await axios.post("/api/generate-sas", {
        blobName: fileName,
        container,
      });

      const fileUrl = response.data.fileUrl;

      if (fileUrl) {
        if (documentType === "report" && fileName.endsWith(".pdf")) {
          // PDF — open directly in browser
          window.open(fileUrl, "_blank");
        } else if (fileName.endsWith(".docx")) {
          // DOCX — open with Microsoft Office viewer
          const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
          window.open(officeViewerUrl, "_blank");
        } else {
          // Other docs — open with Google Docs viewer
          const googleViewerUrl = `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(fileUrl)}`;
          window.open(googleViewerUrl, "_blank");
        }
        
      } else {
        console.error(`❌ No file URL returned for ${title}`);
      }
    } catch (error) {
      console.error(`❌ Error generating SAS token for ${title}:`, error);
  
    }
  };

  return {
    handleView,
  };
};
