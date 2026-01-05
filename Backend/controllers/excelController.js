import ExcelJS from "exceljs";
import User from "../models/User.js";

export const exportUsersExcel = async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        username: 1,
        collegeMail: 1,
        chessAccounts: 1,
        _id: 0,
      }
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users Data");

    worksheet.columns = [
      { header: "Username", key: "username", width: 25 },
      { header: "College Email", key: "email", width: 35 },
      { header: "Chess.com Username", key: "chessCom", width: 25 },
      { header: "Lichess Username", key: "lichess", width: 25 },
    ];

    users.forEach((user) => {
      worksheet.addRow({
        username: user.username,
        email: user.collegeMail,
        chessCom: user.chessAccounts?.chessCom?.username || "N/A",
        lichess: user.chessAccounts?.lichess?.username || "N/A",
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F81BD" },
      };
      cell.font = {
        color: { argb: "FFFFFFFF" },
        bold: true,
        size: 12,
        name: "Calibri",
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", horizontal: "left" };
        });

        if (rowNumber % 2 === 0) {
          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFEAEAEA" },
            };
          });
        }
      }
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Users_Export.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error exporting excel:", err);
    res
      .status(500)
      .json({ success: false, message: "Internal server error during export" });
  }
};
