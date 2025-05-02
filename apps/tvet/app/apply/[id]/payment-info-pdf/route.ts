import { getPaymentInfoPdf } from "@/lib/api/payment";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return new Response("Missing application id", { status: 400 });
  }

  const pdfFile = await getPaymentInfoPdf({ application_id: id });

  if (!pdfFile.data) {
    return new Response("PDF not found", { status: 404 });
  }

  const response = new Response(pdfFile.data, {
    status: 200,
    statusText: "ok",
  });

  response.headers.append("Content-Type", "application/pdf");
  // response.headers.append(
  //   "Content-disposition",
  //   `attachment; filename=${id}.pdf`,
  // );

  return response;
}
