<?php

namespace helena\classes\enums;

abstract class TokenTypeEnum
{
	public const Activation = 'A';
	public const ChangeEmail = 'E';
	public const LostPassword = 'L';
	public const Permission = 'P';
}
