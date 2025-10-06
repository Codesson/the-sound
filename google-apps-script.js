// Google Apps Script for The Sound Project
// This script handles form submissions and data management

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'login':
        return handleLogin(data);
      case 'upload_portfolio':
        return handlePortfolioUpload(data);
      case 'add_product':
        return handleProductAdd(data);
      case 'get_data':
        return handleGetData(data);
      default:
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, message: 'Unknown action' }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch (action) {
      case 'get_portfolio':
        return getPortfolioData();
      case 'get_products':
        return getProductData();
      case 'get_support':
        return getSupportData();
      default:
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, message: 'Unknown action' }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 로그인 처리
function handleLogin(data) {
  const { username, password } = data;
  
  // 간단한 인증 (실제로는 더 안전한 방법 사용)
  if (username === 'admin' && password === 'admin') {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: '로그인 성공',
        token: 'dummy_token_' + Date.now()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '잘못된 사용자명 또는 비밀번호' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 포트폴리오 업로드 처리
function handlePortfolioUpload(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Portfolio');
    if (!sheet) {
      // 시트가 없으면 생성
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Portfolio');
      newSheet.getRange(1, 1, 1, 6).setValues([['Title', 'Description', 'Image', 'Date', 'Category', 'Created']]);
    }
    
    const { title, description, image, category } = data;
    const timestamp = new Date();
    
    sheet.appendRow([title, description, image, timestamp, category, timestamp]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: '포트폴리오가 성공적으로 추가되었습니다' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '포트폴리오 업로드 실패: ' + error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 제품 추가 처리
function handleProductAdd(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
    if (!sheet) {
      // 시트가 없으면 생성
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Products');
      newSheet.getRange(1, 1, 1, 7).setValues([['Model', 'Kind', 'Description', 'Spec', 'Image', 'Alt', 'Created']]);
    }
    
    const { model, kind, description, spec, image, alt } = data;
    const timestamp = new Date();
    
    sheet.appendRow([model, kind, description, spec, image, alt, timestamp]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: '제품이 성공적으로 추가되었습니다' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '제품 추가 실패: ' + error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 데이터 가져오기 처리
function handleGetData(data) {
  const { type } = data;
  
  switch (type) {
    case 'portfolio':
      return getPortfolioData();
    case 'products':
      return getProductData();
    case 'support':
      return getSupportData();
    default:
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, message: 'Unknown data type' }))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

// 포트폴리오 데이터 가져오기
function getPortfolioData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Portfolio');
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const portfolioData = rows.map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      return item;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: portfolioData }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 제품 데이터 가져오기
function getProductData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const productData = rows.map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      return item;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: productData }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 지원 자료 데이터 가져오기
function getSupportData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Support');
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const supportData = rows.map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      return item;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: supportData }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}