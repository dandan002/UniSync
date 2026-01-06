import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    startDate: string;
    endDate?: string;
    gpa?: number;
  }>;
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }>;
  skills?: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string;
  }>;
}

export function generateLatexResume(data: ResumeData): string {
  const { personalInfo, education, experience, skills, projects } = data;

  const escapeLatex = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const latex = `
\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{classic}
\\moderncvcolor{blue}
\\usepackage[scale=0.85]{geometry}
\\usepackage{fontspec}

\\name{${escapeLatex(personalInfo.name.split(' ')[0] || '')}}{${escapeLatex(personalInfo.name.split(' ').slice(1).join(' ') || '')}}
\\email{${escapeLatex(personalInfo.email)}}
${personalInfo.phone ? `\\phone[mobile]{${escapeLatex(personalInfo.phone)}}` : ''}
${personalInfo.location ? `\\address{${escapeLatex(personalInfo.location)}}` : ''}
${personalInfo.linkedin ? `\\social[linkedin]{${escapeLatex(personalInfo.linkedin)}}` : ''}
${personalInfo.website ? `\\homepage{${escapeLatex(personalInfo.website)}}` : ''}

\\begin{document}
\\makecvtitle

${education.length > 0 ? `
\\section{Education}
${education.map(edu => `
\\cventry{${formatDate(edu.startDate)}--${edu.endDate ? formatDate(edu.endDate) : 'Present'}}{${escapeLatex(edu.degree)}${edu.field ? ` in ${escapeLatex(edu.field)}` : ''}}{${escapeLatex(edu.institution)}}{}{${edu.gpa ? `GPA: ${edu.gpa.toFixed(2)}` : ''}}{}
`).join('\n')}
` : ''}

${experience.length > 0 ? `
\\section{Experience}
${experience.map(exp => `
\\cventry{${formatDate(exp.startDate)}--${exp.current ? 'Present' : formatDate(exp.endDate || '')}}{${escapeLatex(exp.title)}}{${escapeLatex(exp.company)}}{${exp.location ? escapeLatex(exp.location) : ''}}{}{${exp.description ? escapeLatex(exp.description) : ''}}
`).join('\n')}
` : ''}

${skills && skills.length > 0 ? `
\\section{Skills}
\\cvitem{}{${skills.map(s => escapeLatex(s)).join(' \\textbullet{} ')}}
` : ''}

${projects && projects.length > 0 ? `
\\section{Projects}
${projects.map(proj => `
\\cvitem{${escapeLatex(proj.name)}}{${escapeLatex(proj.description)}${proj.technologies ? ` \\\\\\textit{Technologies: ${escapeLatex(proj.technologies)}}` : ''}}
`).join('\n')}
` : ''}

\\end{document}
`;

  return latex;
}

export async function compileLatexToPdf(
  latexContent: string,
  outputDir: string = '/tmp'
): Promise<{ success: boolean; pdfPath?: string; error?: string }> {
  const jobId = uuidv4();
  const workDir = path.join(outputDir, jobId);

  try {
    // Create working directory
    await fs.mkdir(workDir, { recursive: true });

    const texPath = path.join(workDir, 'resume.tex');
    const pdfPath = path.join(workDir, 'resume.pdf');

    // Write LaTeX content to file
    await fs.writeFile(texPath, latexContent);

    // Compile LaTeX to PDF using xelatex (for better font support)
    // You can also use pdflatex if xelatex is not available
    try {
      await execAsync(
        `cd ${workDir} && xelatex -interaction=nonstopmode resume.tex`,
        { timeout: 30000 }
      );
    } catch (error) {
      // Try with pdflatex as fallback
      await execAsync(
        `cd ${workDir} && pdflatex -interaction=nonstopmode resume.tex`,
        { timeout: 30000 }
      );
    }

    // Check if PDF was created
    try {
      await fs.access(pdfPath);
      return { success: true, pdfPath };
    } catch {
      return { success: false, error: 'PDF compilation failed' };
    }
  } catch (error) {
    console.error('LaTeX compilation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Alternative: If LaTeX is not installed locally, you can use an API service
export async function compileLatexToPdfViaApi(
  latexContent: string
): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  // This is a placeholder for using a cloud LaTeX compilation service
  // You can integrate with services like:
  // - LaTeX.Online (https://latexonline.cc/)
  // - LaTeX Base API
  // - Your own Docker container with LaTeX

  if (process.env.LATEX_SERVICE_URL) {
    try {
      const response = await fetch(process.env.LATEX_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latex: latexContent }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, pdfUrl: data.pdfUrl };
      }
    } catch (error) {
      console.error('LaTeX API compilation error:', error);
    }
  }

  // Fallback to local compilation
  const result = await compileLatexToPdf(latexContent);
  return {
    success: result.success,
    pdfUrl: result.pdfPath,
    error: result.error,
  };
}
