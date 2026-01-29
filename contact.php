<?php
header("Access-Control-Allow-Origin: https://seyidzade.sbs"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

$data = json_decode(file_get_contents("php://input"));

function sendResponse($success, $message, $code = 200) {
    http_response_code($code);
    echo json_encode(["success" => $success, "message" => $message]);
    exit();
}

// Honeypot 
if (!empty($data->_gotcha)) {
    sendResponse(true, "Packet Sent Successfully."); 
}

// Rate Limiting 
if (isset($_SESSION['last_submit_time']) && (time() - $_SESSION['last_submit_time'] < 300)) {
    sendResponse(false, "Traffic Jam. Wait 5 minutes.", 429);
}

$name = isset($data->name) ? strip_tags(trim($data->name)) : '';
$email = isset($data->email) ? filter_var(trim($data->email), FILTER_SANITIZE_EMAIL) : '';
$message = isset($data->message) ? strip_tags(trim($data->message)) : '';

if (empty($name) || empty($email) || empty($message)) {
    sendResponse(false, "Incomplete Data Packet.", 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, "Invalid Frequency (Email).", 400);
}

// Mail Gönderimi (PHP mail() fonksiyonu)
$to = "seyidzade62@gmail.com"; 
$subject = "PORTFOLIO: New Encrypted Transmission from $name";
$headers = "From: ali@seyidzade.sbs\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

$email_content = "
<html>
<body style='background-color:#000; color:#0f0; font-family:monospace; padding:20px;'>
    <h2 style='border-bottom:1px solid #0f0;'>INCOMING TRANSMISSION</h2>
    <p><strong>Source:</strong> $name</p>
    <p><strong>Frequency:</strong> $email</p>
    <p><strong>Data Payload:</strong><br>$message</p>
    <hr style='border-color:#0f0;'>
    <p style='font-size:10px;'>Sent from Portfolio Secure System</p>
</body>
</html>
";

if(mail($to, $subject, $email_content, $headers)) {
    $_SESSION['last_submit_time'] = time(); 
    sendResponse(true, "Transmission Successful.");
} else {
    sendResponse(false, "Server Link Failure.", 500);
}
?>