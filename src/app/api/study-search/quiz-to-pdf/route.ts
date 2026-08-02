import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildCompleteHtmlDocument, generatePdfWithPuppeteer } from "@/lib/study/pdf-generator";
import { validateDocumentText } from "@/lib/study/pdf-unicode";

const QuizToPdfSchema = z.object({
  documentTitle: z.string().optional(),
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      answer: z.string(),
      explanation: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = QuizToPdfSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid quiz data format for PDF generation." },
        { status: 400 }
      );
    }

    const { documentTitle = "Course Study Material", questions } = parsed.data;
    const cleanDocTitle = validateDocumentText(documentTitle);

    // Build HTML markup for Quiz Test Paper
    const questionsHtml = questions
      .map((q, idx) => {
        const cleanQuestion = validateDocumentText(q.question);
        const cleanOptions = q.options.map((opt) => validateDocumentText(opt));

        const optionsGrid = cleanOptions
          .map((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            return `<div class="option-item"><strong>(${letter})</strong> ${opt}</div>`;
          })
          .join("");

        return `
          <div class="question-box">
            <div class="question-text">
              <span class="q-number">Q${idx + 1}.</span> ${cleanQuestion}
            </div>
            <div class="options-grid">
              ${optionsGrid}
            </div>
          </div>
        `;
      })
      .join("");

    // Build Answer Key & Explanations Section
    const answerKeySummaryHtml = questions
      .map((q, idx) => {
        const cleanAns = validateDocumentText(q.answer);
        return `<div class="key-pill"><strong>Q${idx + 1}:</strong> ${cleanAns}</div>`;
      })
      .join("");

    const answerExplanationsHtml = questions
      .map((q, idx) => {
        const cleanQuestion = validateDocumentText(q.question);
        const cleanAns = validateDocumentText(q.answer);
        const cleanExp = validateDocumentText(q.explanation);

        return `
          <div class="explanation-box">
            <div class="exp-header">
              <span class="exp-q">Q${idx + 1}:</span> ${cleanQuestion}
            </div>
            <div class="exp-ans">
              <strong>Correct Answer:</strong> <span class="ans-badge">${cleanAns}</span>
            </div>
            <div class="exp-text">
              <strong>Explanation:</strong> ${cleanExp}
            </div>
          </div>
        `;
      })
      .join("");

    const fullBodyHtml = `
      <style>
        .exam-header {
          text-align: center;
          padding-bottom: 18px;
          border-bottom: 2.5px solid #334155;
          margin-bottom: 24px;
        }
        .exam-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .exam-subtitle {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 10px;
        }
        .exam-specs {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          background: #f1f5f9;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
        }
        
        .section-title {
          font-size: 15px;
          font-weight: 800;
          color: #1e1b4b;
          border-bottom: 2px solid #6366f1;
          padding-bottom: 4px;
          margin-top: 24px;
          margin-bottom: 16px;
          text-transform: uppercase;
        }

        .question-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 14px;
          page-break-inside: avoid;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .question-text {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .q-number {
          color: #4338ca;
          font-weight: 800;
        }
        .options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 16px;
          font-size: 13px;
          color: #334155;
        }
        .option-item {
          background: #f8fafc;
          padding: 7px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .page-break {
          page-break-before: always;
        }

        .key-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        .key-pill {
          background: #e0e7ff;
          color: #3730a3;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #c7d2fe;
        }

        .explanation-box {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-left: 4px solid #4f46e5;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 12px;
          page-break-inside: avoid;
          font-size: 12px;
          line-height: 1.5;
        }
        .exp-header {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .exp-q {
          color: #4f46e5;
          font-weight: 800;
        }
        .exp-ans {
          color: #15803d;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .ans-badge {
          background: #dcfce7;
          color: #166534;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
        }
        .exp-text {
          color: #475569;
        }
      </style>

      <div class="exam-header">
        <div class="exam-title">Sparks AI Practice Exam Paper</div>
        <div class="exam-subtitle">${cleanDocTitle}</div>
        <div class="exam-specs">
          <span>Total Questions: ${questions.length} MCQs</span>
          <span>Time Allowed: ${questions.length} Minutes</span>
          <span>Generated by Sparks AI</span>
        </div>
      </div>

      <div class="section-title">Part I — Multiple Choice Questions</div>
      ${questionsHtml}

      <div class="page-break"></div>

      <div class="section-title">Part II — Answer Key & AI Explanations</div>
      <div class="key-grid">
        ${answerKeySummaryHtml}
      </div>

      ${answerExplanationsHtml}
    `;

    const fullHtml = buildCompleteHtmlDocument(fullBodyHtml, {
      title: `${cleanDocTitle} - Quiz Exam Paper`,
      lang: "hi",
    });

    const pdfBuffer = await generatePdfWithPuppeteer(fullHtml);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          cleanDocTitle.replace(/[^a-zA-Z0-9_\-]/g, "_")
        )}_Quiz_Exam_Paper.pdf"`,
      },
    });
  } catch (error) {
    console.error("Quiz PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate Quiz PDF." },
      { status: 500 }
    );
  }
}
