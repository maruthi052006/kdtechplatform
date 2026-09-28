from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import CustomTokenObtainPairSerializer, UserSerializer

class CustomLoginView(TokenObtainPairView):
    """
    Login endpoint authenticating via username, email, or student ID.
    Returns access and refresh JWT tokens along with sanitized user info.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

class CurrentUserView(generics.RetrieveAPIView):
    """
    Returns authenticated user profile context.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    """
    Logs out user and blacklists refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Invalid token or already logged out.'}, status=status.HTTP_400_BAD_REQUEST)
