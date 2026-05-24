function LoginButton({logo}) {
  return (
    <button className="login-button">
        <span>Sign in</span>
        <img src={logo} alt="Google" width={20} height={20} />
    </button>
  );
}

export default LoginButton;