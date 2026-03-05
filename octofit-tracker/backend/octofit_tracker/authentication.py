from django.core import signing
from rest_framework import authentication, exceptions
from .models import User


class SignedTokenAuthentication(authentication.BaseAuthentication):
    """Stateless token auth compatible with djongo/object id semantics."""

    keyword = 'Token'
    salt = 'octofit-signed-auth'

    @classmethod
    def issue_token(cls, user):
        return signing.dumps({'username': user.username}, salt=cls.salt)

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode('utf-8')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        raw_token = parts[1]
        try:
            payload = signing.loads(raw_token, salt=self.salt, max_age=60 * 60 * 24)
            user = User.objects.get(username=payload['username'])
        except signing.SignatureExpired as exc:
            raise exceptions.AuthenticationFailed('Token expired.') from exc
        except signing.BadSignature as exc:
            raise exceptions.AuthenticationFailed('Invalid token.') from exc
        except User.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed('User not found.') from exc

        return (user, raw_token)
