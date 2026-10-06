type ReportViewerProps = {
    pdfUrl: string;
    fileName: string;

};


function ReportViewer({ pdfUrl, fileName }: ReportViewerProps) {
    return (
        <section>
            <iframe
                src={pdfUrl}
                title={fileName}
                width="100%"
                height="700px"
            />

            <a href={pdfUrl} download={fileName}>
                Download Test Report
            </a>
        </section>
    );
}

export default ReportViewer;